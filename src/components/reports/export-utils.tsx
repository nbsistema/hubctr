'use client'

import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'

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

export const exportToPDF = (data: Encaminhamento[], titulo: string) => {
  const pdf = new jsPDF()
  
  pdf.setFontSize(16)
  pdf.text(titulo, 20, 20)
  
  pdf.setFontSize(12)
  let yPosition = 40
  
  pdf.text('Paciente', 20, yPosition)
  pdf.text('Médico', 70, yPosition)
  pdf.text('Exame', 120, yPosition)
  pdf.text('Status', 170, yPosition)
  
  yPosition += 10
  
  data.forEach((item) => {
    if (yPosition > 270) {
      pdf.addPage()
      yPosition = 20
    }
    
    pdf.text(item.pacientes.nome.substring(0, 20), 20, yPosition)
    pdf.text(item.medicos.nome.substring(0, 20), 70, yPosition)
    pdf.text(item.exames.nome.substring(0, 20), 120, yPosition)
    pdf.text(item.status, 170, yPosition)
    
    yPosition += 8
  })
  
  pdf.save(`${titulo.toLowerCase().replace(/\s+/g, '-')}.pdf`)
}

export const exportToExcel = (data: Encaminhamento[], titulo: string) => {
  const worksheet = XLSX.utils.json_to_sheet(
    data.map(item => ({
      'Paciente': item.pacientes.nome,
      'CPF': item.pacientes.cpf,
      'Médico': item.medicos.nome,
      'CRM': item.medicos.crm,
      'Empresa': item.medicos.empresas.nome,
      'Exame': item.exames.nome,
      'Tipo': item.tipo,
      'Status': item.status,
      'Data': new Date(item.created_at).toLocaleDateString('pt-BR'),
      'Observação': item.observacao || ''
    }))
  )
  
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório')
  
  XLSX.writeFile(workbook, `${titulo.toLowerCase().replace(/\s+/g, '-')}.xlsx`)
}