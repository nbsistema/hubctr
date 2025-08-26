'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
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
  ClipboardList, 
  Users, 
  FileText, 
  Plus,
  LogOut,
  Trash2
} from 'lucide-react'
import { formatDate, formatCPF } from '@/lib/utils'

interface Checkup {
  id: string
  nome: string
  descricao: string
  created_at: string
  checkup_itens: {
    exames: {
      nome: string
    }
  }[]
}

interface Exame {
  id: string
  nome: string
  descricao: string
}

interface CheckupPaciente {
  id: string
  status: string
  observacao?: string
  created_at: string
  checkups: {
    nome: string
  }
  pacientes: {
    nome: string
    cpf: string
  }
}

export default function CheckupPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [checkups, setCheckups] = useState<Checkup[]>([])
  const [exames, setExames] = useState<Exame[]>([])
  const [pacientes, setPacientes] = useState<any[]>([])
  const [checkupPacientes, setCheckupPacientes] = useState<CheckupPaciente[]>([])
  const [openCheckupModal, setOpenCheckupModal] = useState(false)
  const [openPacienteModal, setOpenPacienteModal] = useState(false)
  const [loadingAction, setLoadingAction] = useState(false)
  const [selectedExames, setSelectedExames] = useState<string[]>([])
  
  const [novoCheckup, setNovoCheckup] = useState({
    nome: '',
    descricao: ''
  })

  const [novoPaciente, setNovoPaciente] = useState({
    nome: '',
    cpf: '',
    nascimento: '',
    checkup_id: ''
  })

  const router = useRouter()


  useEffect(() => {
    checkUser()
    loadExames()
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

    if (!profile || profile.role !== 'checkup') {
      router.push('/')
      return
    }

    setUser(user)
    setProfile(profile)
    setLoading(false)
  }

  const loadExames = async () => {
    try {
      const { data: examesData } = await supabase
        .from('exames')
        .select('*')
        .order('nome')

      setExames(examesData || [])
    } catch (error) {
      console.error('Erro ao carregar exames:', error)
    }
  }

  const loadData = async () => {
    if (!profile?.empresa_id) return

    try {
      // Carregar checkups
      const { data: checkupsData } = await supabase
        .from('checkups')
        .select(`
          *,
          checkup_itens (
            exames (nome)
          )
        `)
        .eq('empresa_id', profile.empresa_id)
        .order('created_at', { ascending: false })

      setCheckups(checkupsData || [])

      // Carregar pacientes
      const { data: pacientesData } = await supabase
        .from('pacientes')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .order('created_at', { ascending: false })

      setPacientes(pacientesData || [])

      // Carregar checkup_pacientes
      const { data: checkupPacientesData } = await supabase
        .from('checkup_pacientes')
        .select(`
          *,
          checkups (nome),
          pacientes (nome, cpf)
        `)
        .order('created_at', { ascending: false })

      setCheckupPacientes(checkupPacientesData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  const handleCriarCheckup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingAction(true)

    try {
      // Criar checkup
      const { data: checkupData, error: checkupError } = await supabase
        .from('checkups')
        .insert([{ ...novoCheckup, empresa_id: profile.empresa_id }])
        .select()
        .single()

      if (checkupError) throw checkupError

      // Adicionar itens do checkup
      if (selectedExames.length > 0) {
        const itens = selectedExames.map(exameId => ({
          checkup_id: checkupData.id,
          exame_id: exameId
        }))

        const { error: itensError } = await supabase
          .from('checkup_itens')
          .insert(itens)

        if (itensError) throw itensError
      }

      setNovoCheckup({ nome: '', descricao: '' })
      setSelectedExames([])
      setOpenCheckupModal(false)
      loadData()
    } catch (error) {
      console.error('Erro ao criar checkup:', error)
    } finally {
      setLoadingAction(false)
    }
  }

  const handleVincularPaciente = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingAction(true)

    try {
      // Primeiro, cadastrar o paciente se necessário
      const { data: pacienteData, error: pacienteError } = await supabase
        .from('pacientes')
        .insert([{
          nome: novoPaciente.nome,
          cpf: novoPaciente.cpf,
          nascimento: novoPaciente.nascimento,
          empresa_id: profile.empresa_id
        }])
        .select()
        .single()

      if (pacienteError) throw pacienteError

      // Vincular ao checkup
      const { error: vinculoError } = await supabase
        .from('checkup_pacientes')
        .insert([{
          checkup_id: novoPaciente.checkup_id,
          paciente_id: pacienteData.id,
          status: 'pendente'
        }])

      if (vinculoError) throw vinculoError

      setNovoPaciente({ nome: '', cpf: '', nascimento: '', checkup_id: '' })
      setOpenPacienteModal(false)
      loadData()
    } catch (error) {
      console.error('Erro ao vincular paciente:', error)
    } finally {
      setLoadingAction(false)
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
              <h1 className="text-2xl font-bold text-orange-600">Check-up Corporativo</h1>
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
        <Tabs defaultValue="checkups" className="space-y-6">
          <TabsList>
            <TabsTrigger value="checkups">Baterias de Check-up</TabsTrigger>
            <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
          </TabsList>

          <TabsContent value="checkups" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Baterias de Check-up</h2>
              <Dialog open={openCheckupModal} onOpenChange={setOpenCheckupModal}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Bateria
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Criar Nova Bateria de Check-up</DialogTitle>
                    <DialogDescription>
                      Defina um conjunto de exames para check-up corporativo
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleCriarCheckup} className="space-y-4">
                    <div>
                      <Label htmlFor="nome">Nome da Bateria</Label>
                      <Input
                        id="nome"
                        value={novoCheckup.nome}
                        onChange={(e) => setNovoCheckup(prev => ({ ...prev, nome: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="descricao">Descrição</Label>
                      <Input
                        id="descricao"
                        value={novoCheckup.descricao}
                        onChange={(e) => setNovoCheckup(prev => ({ ...prev, descricao: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label>Selecionar Exames</Label>
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-2">
                        {exames.map((exame) => (
                          <label key={exame.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedExames.includes(exame.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedExames(prev => [...prev, exame.id])
                                } else {
                                  setSelectedExames(prev => prev.filter(id => id !== exame.id))
                                }
                              }}
                            />
                            <span className="text-sm">{exame.nome}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button type="submit" disabled={loadingAction}>
                        {loadingAction ? <Loading size="sm" /> : 'Criar Bateria'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {checkups.map((checkup) => (
                <Card key={checkup.id}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ClipboardList className="h-5 w-5" />
                      {checkup.nome}
                    </CardTitle>
                    <CardDescription>{checkup.descricao}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Exames inclusos:</p>
                      <div className="flex flex-wrap gap-1">
                        {checkup.checkup_itens.map((item, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {item.exames.nome}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-gray-600">
                        Criado em {formatDate(checkup.created_at)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="funcionarios" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Funcionários em Check-up</h2>
              <Dialog open={openPacienteModal} onOpenChange={setOpenPacienteModal}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Vincular Funcionário
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Vincular Funcionário a Check-up</DialogTitle>
                    <DialogDescription>
                      Adicione um funcionário a uma bateria de check-up
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleVincularPaciente} className="space-y-4">
                    <div>
                      <Label htmlFor="checkup_id">Bateria de Check-up</Label>
                      <Select value={novoPaciente.checkup_id} onValueChange={(value) => setNovoPaciente(prev => ({ ...prev, checkup_id: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a bateria" />
                        </SelectTrigger>
                        <SelectContent>
                          {checkups.map((checkup) => (
                            <SelectItem key={checkup.id} value={checkup.id}>
                              {checkup.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="nome">Nome do Funcionário</Label>
                      <Input
                        id="nome"
                        value={novoPaciente.nome}
                        onChange={(e) => setNovoPaciente(prev => ({ ...prev, nome: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        value={novoPaciente.cpf}
                        onChange={(e) => setNovoPaciente(prev => ({ ...prev, cpf: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="nascimento">Data de Nascimento</Label>
                      <Input
                        id="nascimento"
                        type="date"
                        value={novoPaciente.nascimento}
                        onChange={(e) => setNovoPaciente(prev => ({ ...prev, nascimento: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <DialogFooter>
                      <Button type="submit" disabled={loadingAction}>
                        {loadingAction ? <Loading size="sm" /> : 'Vincular'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Bateria</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {checkupPacientes.map((cp) => (
                      <TableRow key={cp.id}>
                        <TableCell className="font-medium">{cp.pacientes.nome}</TableCell>
                        <TableCell>{formatCPF(cp.pacientes.cpf)}</TableCell>
                        <TableCell>{cp.checkups.nome}</TableCell>
                        <TableCell>
                          <Badge variant={cp.status === 'pendente' ? 'secondary' : 'default'}>
                            {cp.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(cp.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
