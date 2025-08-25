'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Loading } from "@/components/ui/loading"
import { 
  Stethoscope, 
  CreditCard, 
  FileText, 
  Plus,
  LogOut,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { getStatusColor, formatDate, formatCPF, formatCRM } from '@/lib/utils'

interface Medico {
  id: string
  nome: string
  crm: string
  especialidade: string
  created_at: string
}

interface Convenio {
  id: string
  nome: string
  created_at: string
}

interface Encaminhamento {
  id: string
  status: string
  tipo: string
  observacao?: string
  created_at: string
  pacientes: {
    nome: string
    cpf: string
  }
  medicos: {
    nome: string
    crm: string
  }
  exames: {
    nome: string
  }
}

export default function ParceiroPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [medicos, setMedicos] = useState<Medico[]>([])
  const [convenios, setConvenios] = useState<Convenio[]>([])
  const [encaminhamentos, setEncaminhamentos] = useState<Encaminhamento[]>([])
  const [openMedicoModal, setOpenMedicoModal] = useState(false)
  const [openConvenioModal, setOpenConvenioModal] = useState(false)
  const [loadingAction, setLoadingAction] = useState(false)
  
  const [novoMedico, setNovoMedico] = useState({
    nome: '',
    crm: '',
    especialidade: ''
  })

  const [novoConvenio, setNovoConvenio] = useState({
    nome: ''
  })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (profile?.empresa_id) {
      loadData()
    }
  }, [profile])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/')
      return
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.role !== 'parceiro') {
      router.push('/')
      return
    }

    setUser(user)
    setProfile(profile)
    setLoading(false)
  }

  const loadData = async () => {
    if (!profile?.empresa_id) return

    try {
      // Carregar médicos
      const { data: medicosData } = await supabase
        .from('medicos')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .order('created_at', { ascending: false })

      setMedicos(medicosData || [])

      // Carregar convênios
      const { data: conveniosData } = await supabase
        .from('convenios')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .order('created_at', { ascending: false })

      setConvenios(conveniosData || [])

      // Carregar encaminhamentos
      const { data: encaminhamentosData } = await supabase
        .from('encaminhamentos')
        .select(`
          *,
          pacientes (nome, cpf, empresa_id),
          medicos (nome, crm, empresa_id),
          exames (nome)
        `)
        .eq('medicos.empresa_id', profile.empresa_id)
        .order('created_at', { ascending: false })

      setEncaminhamentos(encaminhamentosData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  const handleCadastrarMedico = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingAction(true)

    try {
      const { error } = await supabase
        .from('medicos')
        .insert([{ ...novoMedico, empresa_id: profile.empresa_id }])

      if (error) throw error

      setNovoMedico({ nome: '', crm: '', especialidade: '' })
      setOpenMedicoModal(false)
      loadData()
    } catch (error) {
      console.error('Erro ao cadastrar médico:', error)
    } finally {
      setLoadingAction(false)
    }
  }

  const handleCadastrarConvenio = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingAction(true)

    try {
      const { error } = await supabase
        .from('convenios')
        .insert([{ ...novoConvenio, empresa_id: profile.empresa_id }])

      if (error) throw error

      setNovoConvenio({ nome: '' })
      setOpenConvenioModal(false)
      loadData()
    } catch (error) {
      console.error('Erro ao cadastrar convênio:', error)
    } finally {
      setLoadingAction(false)
    }
  }

  const handleMarcarIntervencao = async (id: string) => {
    const detalhe = prompt('Digite o detalhamento da intervenção:')
    if (!detalhe) return

    try {
      const { error } = await supabase
        .from('encaminhamentos')
        .update({ 
          status: 'intervenção',
          observacao: detalhe
        })
        .eq('id', id)

      if (error) throw error
      loadData()
    } catch (error) {
      console.error('Erro ao marcar intervenção:', error)
    }
  }

  const handleMarcarAcompanhamento = async (id: string) => {
    try {
      const { error } = await supabase
        .from('encaminhamentos')
        .update({ status: 'acompanhamento' })
        .eq('id', id)

      if (error) throw error
      loadData()
    } catch (error) {
      console.error('Erro ao marcar acompanhamento:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-purple-600">Área do Parceiro</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-gray-600">Olá, {profile?.nome}</span>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="encaminhamentos" className="space-y-6">
          <TabsList>
            <TabsTrigger value="encaminhamentos">Meus Encaminhamentos</TabsTrigger>
            <TabsTrigger value="medicos">Médicos</TabsTrigger>
            <TabsTrigger value="convenios">Convênios</TabsTrigger>
          </TabsList>

          <TabsContent value="encaminhamentos" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Pacientes Executados</h2>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Médico</TableHead>
                      <TableHead>Exame</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {encaminhamentos.filter(enc => enc.status === 'executado').map((enc) => (
                      <TableRow key={enc.id}>
                        <TableCell className="font-medium">{enc.pacientes.nome}</TableCell>
                        <TableCell>{formatCPF(enc.pacientes.cpf)}</TableCell>
                        <TableCell>{enc.medicos.nome}</TableCell>
                        <TableCell>{enc.exames.nome}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(enc.status)}>
                            {enc.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(enc.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleMarcarIntervencao(enc.id)}
                            >
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              Intervenção
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleMarcarAcompanhamento(enc.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Acompanhamento
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medicos" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Médicos</h2>
              <Dialog open={openMedicoModal} onOpenChange={setOpenMedicoModal}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Médico
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cadastrar Novo Médico</DialogTitle>
                    <DialogDescription>
                      Adicione um novo médico à sua empresa
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleCadastrarMedico} className="space-y-4">
                    <div>
                      <Label htmlFor="nome">Nome do Médico</Label>
                      <Input
                        id="nome"
                        value={novoMedico.nome}
                        onChange={(e) => setNovoMedico(prev => ({ ...prev, nome: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="crm">CRM</Label>
                      <Input
                        id="crm"
                        value={novoMedico.crm}
                        onChange={(e) => setNovoMedico(prev => ({ ...prev, crm: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="especialidade">Especialidade</Label>
                      <Input
                        id="especialidade"
                        value={novoMedico.especialidade}
                        onChange={(e) => setNovoMedico(prev => ({ ...prev, especialidade: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <DialogFooter>
                      <Button type="submit" disabled={loadingAction}>
                        {loadingAction ? <Loading size="sm" /> : 'Cadastrar'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {medicos.map((medico) => (
                <Card key={medico.id}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Stethoscope className="h-5 w-5" />
                      {medico.nome}
                    </CardTitle>
                    <CardDescription>
                      {formatCRM(medico.crm)} - {medico.especialidade}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Cadastrado em {formatDate(medico.created_at)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="convenios" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Convênios</h2>
              <Dialog open={openConvenioModal} onOpenChange={setOpenConvenioModal}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Convênio
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cadastrar Novo Convênio</DialogTitle>
                    <DialogDescription>
                      Adicione um novo convênio à sua empresa
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleCadastrarConvenio} className="space-y-4">
                    <div>
                      <Label htmlFor="nome">Nome do Convênio</Label>
                      <Input
                        id="nome"
                        value={novoConvenio.nome}
                        onChange={(e) => setNovoConvenio(prev => ({ ...prev, nome: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <DialogFooter>
                      <Button type="submit" disabled={loadingAction}>
                        {loadingAction ? <Loading size="sm" /> : 'Cadastrar'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {convenios.map((convenio) => (
                <Card key={convenio.id}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      {convenio.nome}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Cadastrado em {formatDate(convenio.created_at)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}