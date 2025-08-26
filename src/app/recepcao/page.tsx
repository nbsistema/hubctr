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
  Building2, 
  FileText, 
  Plus,
  LogOut,
  CheckCircle,
  Clock,
  AlertTriangle,
  Filter,
  Download
} from 'lucide-react'
import { getStatusColor, formatDate, formatCPF } from '@/lib/utils'

interface Empresa {
  id: string
  nome: string
  tipo: string
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
    empresas: {
      nome: string
    }
  }
  exames: {
    nome: string
  }
}

export default function RecepcaoPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [encaminhamentos, setEncaminhamentos] = useState<Encaminhamento[]>([])
  const [openEmpresaModal, setOpenEmpresaModal] = useState(false)
  const [loadingAction, setLoadingAction] = useState(false)
  const [statusFilter, setStatusFilter] = useState('todos')
  
  const [novaEmpresa, setNovaEmpresa] = useState({
    nome: '',
    tipo: 'parceiro' as 'parceiro' | 'checkup'
  })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
    loadData()
  }, [])

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

    if (!profile || profile.role !== 'recepcao') {
      router.push('/')
      return
    }

    setUser(user)
    setProfile(profile)
    setLoading(false)
  }

  const loadData = async () => {
    try {
      // Carregar empresas
      const { data: empresasData } = await supabase
        .from('empresas')
        .select('*')
        .order('created_at', { ascending: false })

      setEmpresas(empresasData || [])

      // Carregar encaminhamentos
      const { data: encaminhamentosData } = await supabase
        .from('encaminhamentos')
        .select(`
          *,
          pacientes (nome, cpf),
          medicos (nome, crm, empresas (nome)),
          exames (nome)
        `)
        .order('created_at', { ascending: false })

      setEncaminhamentos(encaminhamentosData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  const handleCadastrarEmpresa = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingAction(true)

    try {
      const { error } = await supabase
        .from('empresas')
        .insert([{
          nome: novaEmpresa.nome,
          tipo: novaEmpresa.tipo,
          email: null
        }])

      if (error) throw error

      setNovaEmpresa({ nome: '', tipo: 'parceiro' as 'parceiro' | 'checkup' })
      setOpenEmpresaModal(false)
      loadData()
    } catch (error) {
      console.error('Erro ao cadastrar empresa:', error)
    } finally {
      setLoadingAction(false)
    }
  }

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('encaminhamentos')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error

      loadData()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const filteredEncaminhamentos = encaminhamentos.filter(enc => 
    statusFilter === 'todos' || enc.status === statusFilter
  )

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
              <h1 className="text-2xl font-bold text-green-600">Recepção</h1>
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
        <Tabs defaultValue="pedidos" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pedidos">Pedidos de Exame</TabsTrigger>
            <TabsTrigger value="empresas">Empresas</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="pedidos" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Pedidos de Exame</h2>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os status</SelectItem>
                    <SelectItem value="encaminhado">Encaminhado</SelectItem>
                    <SelectItem value="executado">Executado</SelectItem>
                    <SelectItem value="intervenção">Intervenção</SelectItem>
                    <SelectItem value="acompanhamento">Acompanhamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Médico</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Exame</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEncaminhamentos.map((enc) => (
                      <TableRow key={enc.id}>
                        <TableCell className="font-medium">{enc.pacientes.nome}</TableCell>
                        <TableCell>{formatCPF(enc.pacientes.cpf)}</TableCell>
                        <TableCell>{enc.medicos.nome}</TableCell>
                        <TableCell>{enc.medicos.empresas.nome}</TableCell>
                        <TableCell>{enc.exames.nome}</TableCell>
                        <TableCell>
                          <Badge variant={enc.tipo === 'convenio' ? 'default' : 'secondary'}>
                            {enc.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(enc.status)}>
                            {enc.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(enc.created_at)}</TableCell>
                        <TableCell>
                          <Select onValueChange={(value) => handleUpdateStatus(enc.id, value)}>
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Alterar" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="encaminhado">Encaminhado</SelectItem>
                              <SelectItem value="executado">Executado</SelectItem>
                              <SelectItem value="intervenção">Intervenção</SelectItem>
                              <SelectItem value="acompanhamento">Acompanhamento</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="empresas" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Empresas Parceiras</h2>
              <Dialog open={openEmpresaModal} onOpenChange={setOpenEmpresaModal}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Empresa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cadastrar Nova Empresa</DialogTitle>
                    <DialogDescription>
                      Adicione uma nova empresa parceira ao sistema
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleCadastrarEmpresa} className="space-y-4">
                    <div>
                      <Label htmlFor="nome">Nome da Empresa</Label>
                      <Input
                        id="nome"
                        value={novaEmpresa.nome}
                        onChange={(e) => setNovaEmpresa(prev => ({ ...prev, nome: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="tipo">Tipo</Label>
                      <Select value={novaEmpresa.tipo} onValueChange={(value: 'parceiro' | 'checkup') => setNovaEmpresa(prev => ({ ...prev, tipo: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="parceiro">Parceiro</SelectItem>
                          <SelectItem value="checkup">Check-up</SelectItem>
                        </SelectContent>
                      </Select>
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
              {empresas.map((empresa) => (
                <Card key={empresa.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{empresa.nome}</CardTitle>
                        <CardDescription>
                          Cadastrada em {formatDate(empresa.created_at)}
                        </CardDescription>
                      </div>
                      <Badge variant={empresa.tipo === 'parceiro' ? 'default' : 'secondary'}>
                        {empresa.tipo}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">Tipo: {empresa.tipo}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="relatorios">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios de Encaminhamentos</CardTitle>
                <CardDescription>
                  Gere relatórios por período, médico, tipo de exame, convênio/particular e status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <Label>Data Início</Label>
                    <Input type="date" />
                  </div>
                  <div>
                    <Label>Data Fim</Label>
                    <Input type="date" />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="encaminhado">Encaminhado</SelectItem>
                        <SelectItem value="executado">Executado</SelectItem>
                        <SelectItem value="intervenção">Intervenção</SelectItem>
                        <SelectItem value="acompanhamento">Acompanhamento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar PDF
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}