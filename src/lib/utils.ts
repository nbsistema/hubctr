import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR')
}

export function formatCPF(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function formatCRM(crm: string): string {
  return `CRM ${crm}`
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'encaminhado':
      return 'bg-yellow-100 text-yellow-800'
    case 'executado':
      return 'bg-blue-100 text-blue-800'
    case 'intervencao':
    case 'intervenção':
      return 'bg-red-100 text-red-800'
    case 'acompanhamento':
      return 'bg-green-100 text-green-800'
    case 'pendente':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

