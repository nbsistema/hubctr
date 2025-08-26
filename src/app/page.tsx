'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loading } from "@/components/ui/loading"
import { Building2, Stethoscope, ClipboardList, Users } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (profile) {
        redirectToRole(profile.role)
      }
    }
  }

  const redirectToRole = (role: string) => {
    switch (role) {
      case 'admin':
        router.push('/admin')
        break
      case 'recepcao':
        router.push('/recepcao')
        break
      case 'parceiro':
        router.push('/parceiro')
        break
      case 'checkup':
        router.push('/checkup')
        break
      default:
        router.push('/admin')
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      if (data.user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', data.user.id)
          .single()

        if (profile) {
          redirectToRole(profile.role)
        } else {
          setError('Perfil de usuário não encontrado')
        }
      }
    } catch (error: any) {
      setError(error.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="text-center lg:text-left">
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
            NB Consultoria
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Sistema de Gestão para Clínicas e Laboratórios
          </p>
          
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0">
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <p className="font-semibold text-sm">Empresas</p>
                <p className="text-xs text-gray-600">Parceiras</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
              <Stethoscope className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-semibold text-sm">Médicos</p>
                <p className="text-xs text-gray-600">Especialistas</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
              <ClipboardList className="h-8 w-8 text-orange-600" />
              <div>
                <p className="font-semibold text-sm">Check-ups</p>
                <p className="text-xs text-gray-600">Corporativos</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
              <Users className="h-8 w-8 text-purple-600" />
              <div>
                <p className="font-semibold text-sm">Pacientes</p>
                <p className="text-xs text-gray-600">Atendidos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Fazer Login</CardTitle>
            <CardDescription>
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm text-center">
                  {error}
                </div>
              )}
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loading size="sm" /> : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
