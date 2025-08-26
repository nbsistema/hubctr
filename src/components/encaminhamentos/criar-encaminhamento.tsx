'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Loading } from "@/components/ui/loading"
import { Plus } from 'lucide-react'

interface CriarEncaminhamentoProps {
  empresaId: string
  onSuccess?: () => void
}

interface Medico {
  id: string
  nome: string
  crm: string
}

interface Exame {
  id: string
  nome: string
}

export function CriarEncaminhamento({ empresaId, onSuccess }: CriarEncaminhamentoProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [medicos, setMedicos] = useState<Medico[]>([])
  const [exames, setExames] = useState<Exame[]>([])
  const [formData, setFormData] = useState({
    paciente_nome: '',
    paciente_cpf: '',
    paciente_nascimento: '',
    medico_id: '',
    exame_id: '',
    tipo: 'convenio',
    observacao: ''
  })


  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  const loadData = async () => {
    try {
      // Carregar médicos da empresa
      const { data: medicosData } = await supabase
        .from('medicos')
        .select('id, nome, crm')
        .eq('empresa_id', empresaId)

      setMedicos(medicosData || [])

      // Carregar exames
      const { data: examesData } = await supabase
        .from('exames')
        .select('id, nome')

      setExames(examesData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Criar/buscar paciente
      let pacienteId: string

      const { data: pacienteExistente } = await supabase
        .from('pacientes')
        .select('id')
        .eq('cpf', formData.paciente_cpf)
        .eq('empresa_id', empresaId)
        .single()

      if (pacienteExistente) {
        pacienteId = pacienteExistente.id
      } else {
        const { data: novoPaciente, error: pacienteError } = await supabase
          .from('pacientes')
          .insert([{
            nome: formData.paciente_nome,
            cpf: formData.paciente_cpf,
            nascimento: formData.paciente_nascimento,
            empresa_id: empresaId
          }])
          .select()
          .single()

        if (pacienteError) throw pacienteError
        pacienteId = novoPaciente.id
      }

      // 2. Criar encaminhamento
      const { error: encaminhamentoError } = await supabase
        .from('encaminhamentos')
        .insert([{
          paciente_id: pacienteId,
          medico_id: formData.medico_id,
          exame_id: formData.exame_id,
          tipo: formData.tipo,
          observacao: formData.observacao,
          status: 'encaminhado'
        }])

      if (encaminhamentoError) throw encaminhamentoError

      setFormData({
        paciente_nome: '',
        paciente_cpf: '',
        paciente_nascimento: '',
        medico_id: '',
        exame_id: '',
        tipo: 'convenio',
        observacao: ''
      })
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error('Erro ao criar encaminhamento:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Encaminhamento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Encaminhamento</DialogTitle>
          <DialogDescription>
            Encaminhe um paciente para exame
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="paciente_nome">Nome do Paciente</Label>
            <Input
              id="paciente_nome"
              value={formData.paciente_nome}
              onChange={(e) => setFormData(prev => ({ ...prev, paciente_nome: e.target.value }))}
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="paciente_cpf">CPF</Label>
            <Input
              id="paciente_cpf"
              value={formData.paciente_cpf}
              onChange={(e) => setFormData(prev => ({ ...prev, paciente_cpf: e.target.value }))}
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="paciente_nascimento">Data de Nascimento</Label>
            <Input
              id="paciente_nascimento"
              type="date"
              value={formData.paciente_nascimento}
              onChange={(e) => setFormData(prev => ({ ...prev, paciente_nascimento: e.target.value }))}
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="medico">Médico</Label>
            <Select value={formData.medico_id} onValueChange={(value) => setFormData(prev => ({ ...prev, medico_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o médico" />
              </SelectTrigger>
              <SelectContent>
                {medicos.map((medico) => (
                  <SelectItem key={medico.id} value={medico.id}>
                    {medico.nome} - CRM {medico.crm}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="exame">Exame</Label>
            <Select value={formData.exame_id} onValueChange={(value) => setFormData(prev => ({ ...prev, exame_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o exame" />
              </SelectTrigger>
              <SelectContent>
                {exames.map((exame) => (
                  <SelectItem key={exame.id} value={exame.id}>
                    {exame.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tipo">Tipo</Label>
            <Select value={formData.tipo} onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="convenio">Convênio</SelectItem>
                <SelectItem value="particular">Particular</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="observacao">Observação</Label>
            <Input
              id="observacao"
              value={formData.observacao}
              onChange={(e) => setFormData(prev => ({ ...prev, observacao: e.target.value }))}
              disabled={loading}
            />
          </div>
          
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? <Loading size="sm" /> : 'Criar Encaminhamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
