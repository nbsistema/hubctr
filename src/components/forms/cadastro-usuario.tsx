'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Loading } from "@/components/ui/loading"
import { UserPlus } from 'lucide-react'

interface Empresa {
  id: string
  nome: string
  tipo: string
}

interface CadastroUsuarioProps {
  onSuccess?: () => void
}

export function CadastroUsuario({ onSuccess }: CadastroUsuarioProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [formData, setFormData] = useState({
    nome: '',
    empresa_id: '',
    role: '',
    email: '',
    senha: '',
    confirmSenha: ''
  })


  useEffect(() => {
    if (open) {
      loadEmpresas()
    }
  }, [open])

  const loadEmpresas = async () => {
    try {
      const { data } = await supabase
        .from('empresas')
        .select('*')
        .order('nome')

      setEmpresas(data || [])
    } catch (error) {
      console.error('Erro ao carregar empresas:', error)
    }
  }

  const handleEmpresaChange = (empresaId: string) => {
    const empresa = empresas.find(e => e.id === empresaId)
    setFormData(prev => ({
      ...prev,
      empresa_id: empresaId,
      role: empresa?.tipo === 'parceiro' ? 'parceiro' : 'checkup'
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.senha !== formData.confirmSenha) {
      alert('As senhas não coincidem')
      return
    }
    
    setLoading(true)

    try {
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.senha,
        options: {
          emailRedirectTo: undefined
        }
      })

      if (authError) throw authError

      // 2. Criar perfil do usuário
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert([{
            user_id: authData.user.id,
            role: formData.role,
            nome: formData.nome,
            empresa_id: formData.empresa_id
          }])

        if (profileError) throw profileError
      }

      setFormData({ nome: '', empresa_id: '', role: '', email: '', senha: '', confirmSenha: '' })
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error('Erro ao cadastrar usuário:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus className="h-4 w-4 mr-2" />
          Cadastrar Usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
          <DialogDescription>
            Vincule um usuário a uma empresa já cadastrada
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="empresa">Empresa</Label>
            <Select value={formData.empresa_id} onValueChange={handleEmpresaChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a empresa" />
              </SelectTrigger>
              <SelectContent>
                {empresas.map((empresa) => (
                  <SelectItem key={empresa.id} value={empresa.id}>
                    {empresa.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="nome">Nome da Pessoa</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              required
              disabled={loading}
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              value={formData.senha}
              onChange={(e) => setFormData(prev => ({ ...prev, senha: e.target.value }))}
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          <div>
            <Label htmlFor="confirmSenha">Confirmar Senha</Label>
            <Input
              id="confirmSenha"
              type="password"
              value={formData.confirmSenha}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmSenha: e.target.value }))}
              required
              disabled={loading}
              minLength={6}
            />
          </div>
          
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? <Loading size="sm" /> : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
