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
import { StatsCards } from "@/components/dashboard/stats-cards"
import { CadastroEmpresa } from "@/components/forms/cadastro-empresa"
import { CadastroUsuario } from "@/components/forms/cadastro-usuario"
import { 
  Building2, 
  Users, 
  FileText, 
  Plus,
  LogOut,
  Settings,
  BarChart3
} from 'lucide-react'
import { getStatusColor, formatDate, formatCPF } from '@/lib/utils'

interface Empresa {
  id: string
  nome: string
  tipo: string
  created_at: string
}

interface Exame {
  id: string
  nome: string
  descricao: string
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

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [exames, setExames] = useState<Exame[]>([])
  const [encaminhamentos, setEncaminhamentos] = useState<Encaminhamento[]>([])
  const [openExameModal, setOpenExameModal] = useState(false)
  const [loadingAction, setLoadingAction] = useState(false)
  
  const [novoExame, setNovoExame] = useState({
    nome: '',
    descricao: ''
  })

  const router = useRouter()


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

    if (!profile || profile.role !== 'admin') {
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

      // Carregar exames
      const { data: examesData } = await supabase
        .from('exames')
        .select('*')
        .order('nome')

      setExames(examesData || [])

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

  const handleCadastrarExame = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!novoExame.nome.trim() || !novoExame.descricao.trim()) {
      alert('Por favor, preencha todos os campos')
      return
    }
    
    setLoadingAction(true)

    try {
      const { error } = await supabase
        .from('exames')
        .insert([novoExame])

      if (error) throw error

      setNovoExame({ nome: '', descricao: '' })
      setOpenExameModal(false)
      loadData()
    } catch (error) {
      console.error('Erro ao cadastrar exame:', error)
    } finally {
      setLoadingAction(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const stats = {
    totalEncaminhamentos: encaminhamentos.length,
    executados: encaminhamentos.filter(e => e.status === 'executado').length,
    intervencao: encaminhamentos.filter(e => e.status === 'intervenção' || e.status === 'intervencao').length,
    acompanhamento: encaminhamentos.filter(e => e.status === 'acompanhamento').length
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
              <h1 className="text-2xl font-bold text-blue-600">Painel Administrativo</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-gray-600">Olá, Administrador</span>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="mb-8">
          <StatsCards stats={stats} />
        </div>

        <Tabs defaultValue="empresas" className="space-y-6">
          <TabsList>
            <TabsTrigger value="empresas">Empresas</TabsTrigger>
            <TabsTrigger value="exames">Exames</TabsTrigger>
            <TabsTrigger value="encaminhamentos">Encaminhamentos</TabsTrigger>
          </TabsList>

          <TabsContent value="empresas" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Empresas</h2>
              <div className="flex gap-2">
                <CadastroEmpresa onSuccess={loadData} />
                <CadastroUsuario onSuccess={loadData} />
              </div>
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
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="exames" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Exames</h2>
              <Dialog open={openExameModal} onOpenChange={setOpenExameModal}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Exame
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cadastrar Novo Exame</DialogTitle>
                    <DialogDescription>
                      Adicione um novo tipo de exame ao sistema
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleCadastrarExame} className="space-y-4">
                    <div>
                      <Label htmlFor="nome">Nome do Exame</Label>
                      <Input
                        id="nome"
                        value={novoExame.nome}
                        onChange={(e) => setNovoExame(prev => ({ ...prev, nome: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="descricao">Descrição</Label>
                      <Input
                        id="descricao"
                        value={novoExame.descricao}
                        onChange={(e) => setNovoExame(prev => ({ ...prev, descricao: e.target.value }))}
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
              {exames.map((exame) => (
                <Card key={exame.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{exame.nome}</CardTitle>
                    <CardDescription>{exame.descricao}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="encaminhamentos" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Todos os Encaminhamentos</h2>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {encaminhamentos.map((enc) => (
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
