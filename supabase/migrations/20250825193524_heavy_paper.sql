/*
  # Sistema NB Consultoria - Schema Inicial

  ## Novas Tabelas
  1. **user_profiles** - Perfis de usuários com roles
  2. **empresas** - Empresas parceiras e de check-up  
  3. **medicos** - Médicos cadastrados por empresa
  4. **convenios** - Convênios por empresa
  5. **pacientes** - Pacientes por empresa
  6. **exames** - Catálogo de exames
  7. **encaminhamentos** - Encaminhamentos de exames
  8. **checkups** - Baterias de check-up
  9. **checkup_itens** - Itens dos check-ups
  10. **checkup_pacientes** - Pacientes vinculados a check-ups

  ## Segurança
  - RLS habilitado em todas as tabelas
  - Políticas baseadas em roles de usuário
*/

-- Perfis de usuários
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text CHECK (role IN ('admin', 'recepcao', 'parceiro', 'checkup')) NOT NULL,
  nome text NOT NULL,
  empresa_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Empresas (parceiros e check-ups)
CREATE TABLE IF NOT EXISTS empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text CHECK (tipo IN ('parceiro', 'checkup')) NOT NULL,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Médicos
CREATE TABLE IF NOT EXISTS medicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  nome text NOT NULL,
  crm text NOT NULL,
  especialidade text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Convênios
CREATE TABLE IF NOT EXISTS convenios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  nome text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Pacientes
CREATE TABLE IF NOT EXISTS pacientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cpf text NOT NULL,
  nascimento date NOT NULL,
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Exames
CREATE TABLE IF NOT EXISTS exames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Encaminhamentos
CREATE TABLE IF NOT EXISTS encaminhamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid REFERENCES pacientes(id) ON DELETE CASCADE NOT NULL,
  medico_id uuid REFERENCES medicos(id) ON DELETE CASCADE NOT NULL,
  exame_id uuid REFERENCES exames(id) ON DELETE CASCADE NOT NULL,
  ctr_id text,
  status text CHECK (status IN ('encaminhado', 'executado', 'intervenção', 'acompanhamento')) DEFAULT 'encaminhado',
  tipo text CHECK (tipo IN ('convenio', 'particular')) NOT NULL,
  observacao text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Check-ups
CREATE TABLE IF NOT EXISTS checkups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  nome text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Itens dos check-ups
CREATE TABLE IF NOT EXISTS checkup_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkup_id uuid REFERENCES checkups(id) ON DELETE CASCADE NOT NULL,
  exame_id uuid REFERENCES exames(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(checkup_id, exame_id)
);

-- Pacientes vinculados a check-ups
CREATE TABLE IF NOT EXISTS checkup_pacientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkup_id uuid REFERENCES checkups(id) ON DELETE CASCADE NOT NULL,
  paciente_id uuid REFERENCES pacientes(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pendente',
  observacao text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(checkup_id, paciente_id)
);

-- Adicionar foreign key para empresa_id em user_profiles
ALTER TABLE user_profiles 
ADD CONSTRAINT fk_user_profiles_empresa 
FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL;

-- Habilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE convenios ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE exames ENABLE ROW LEVEL SECURITY;
ALTER TABLE encaminhamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkups ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkup_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkup_pacientes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS

-- user_profiles: usuários podem ver e editar próprio perfil, admin vê todos
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'admin'
    )
  );

-- empresas: admin e recepção veem todas, outros veem apenas suas empresas
CREATE POLICY "Admins and reception can read all companies"
  ON empresas FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role IN ('admin', 'recepcao')
    )
  );

CREATE POLICY "Partners can read own company"
  ON empresas FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.empresa_id = id
    )
  );

CREATE POLICY "Reception can insert companies"
  ON empresas FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'recepcao'
    )
  );

-- medicos: acesso baseado na empresa
CREATE POLICY "Users can read doctors from their company"
  ON medicos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() 
      AND (
        up.role IN ('admin', 'recepcao') OR
        up.empresa_id = empresa_id
      )
    )
  );

CREATE POLICY "Partners can manage doctors from their company"
  ON medicos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() 
      AND up.empresa_id = empresa_id
      AND up.role = 'parceiro'
    )
  );

-- convenios: acesso baseado na empresa
CREATE POLICY "Users can read agreements from their company"
  ON convenios FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() 
      AND (
        up.role IN ('admin', 'recepcao') OR
        up.empresa_id = empresa_id
      )
    )
  );

CREATE POLICY "Partners can manage agreements from their company"
  ON convenios FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() 
      AND up.empresa_id = empresa_id
      AND up.role = 'parceiro'
    )
  );

-- pacientes: acesso baseado na empresa
CREATE POLICY "Users can read patients from their company"
  ON pacientes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() 
      AND (
        up.role IN ('admin', 'recepcao') OR
        up.empresa_id = empresa_id
      )
    )
  );

CREATE POLICY "Companies can manage their patients"
  ON pacientes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() 
      AND up.empresa_id = empresa_id
      AND up.role IN ('parceiro', 'checkup')
    )
  );

-- exames: todos podem ler, admin pode gerenciar
CREATE POLICY "All users can read exams"
  ON exames FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage exams"
  ON exames FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'admin'
    )
  );

-- encaminhamentos: acesso baseado na empresa do paciente
CREATE POLICY "Users can read referrals from their company"
  ON encaminhamentos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN pacientes p ON p.empresa_id = up.empresa_id
      WHERE up.user_id = auth.uid() 
      AND p.id = paciente_id
      AND (
        up.role IN ('admin', 'recepcao', 'parceiro') OR
        up.empresa_id = p.empresa_id
      )
    )
  );

CREATE POLICY "Partners can create referrals for their patients"
  ON encaminhamentos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN pacientes p ON p.empresa_id = up.empresa_id
      WHERE up.user_id = auth.uid() 
      AND p.id = paciente_id
      AND up.role = 'parceiro'
    )
  );

CREATE POLICY "Reception and partners can update referrals"
  ON encaminhamentos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN pacientes p ON p.empresa_id = up.empresa_id
      WHERE up.user_id = auth.uid() 
      AND p.id = paciente_id
      AND up.role IN ('recepcao', 'parceiro')
    )
  );

-- checkups: acesso baseado na empresa
CREATE POLICY "Users can read checkups from their company"
  ON checkups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() 
      AND (
        up.role IN ('admin', 'recepcao') OR
        up.empresa_id = empresa_id
      )
    )
  );

CREATE POLICY "Checkup companies can manage their checkups"
  ON checkups FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() 
      AND up.empresa_id = empresa_id
      AND up.role = 'checkup'
    )
  );

-- checkup_itens: acesso baseado no checkup
CREATE POLICY "Users can read checkup items from their company"
  ON checkup_itens FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN checkups c ON c.empresa_id = up.empresa_id
      WHERE up.user_id = auth.uid() 
      AND c.id = checkup_id
      AND (
        up.role IN ('admin', 'recepcao') OR
        up.empresa_id = c.empresa_id
      )
    )
  );

CREATE POLICY "Checkup companies can manage their checkup items"
  ON checkup_itens FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN checkups c ON c.empresa_id = up.empresa_id
      WHERE up.user_id = auth.uid() 
      AND c.id = checkup_id
      AND up.role = 'checkup'
    )
  );

-- checkup_pacientes: acesso baseado no checkup
CREATE POLICY "Users can read checkup patients from their company"
  ON checkup_pacientes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN checkups c ON c.empresa_id = up.empresa_id
      WHERE up.user_id = auth.uid() 
      AND c.id = checkup_id
      AND (
        up.role IN ('admin', 'recepcao') OR
        up.empresa_id = c.empresa_id
      )
    )
  );

CREATE POLICY "Checkup companies can manage their checkup patients"
  ON checkup_pacientes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN checkups c ON c.empresa_id = up.empresa_id
      WHERE up.user_id = auth.uid() 
      AND c.id = checkup_id
      AND up.role = 'checkup'
    )
  );

-- Inserir alguns dados iniciais

-- Exames básicos
INSERT INTO exames (nome, descricao) VALUES
('Hemograma Completo', 'Análise completa do sangue'),
('Glicemia de Jejum', 'Dosagem de glicose no sangue em jejum'),
('Colesterol Total e Frações', 'Perfil lipídico completo'),
('Creatinina', 'Avaliação da função renal'),
('TGO/TGP', 'Enzimas hepáticas'),
('TSH', 'Hormônio estimulante da tireoide'),
('Eletrocardiograma', 'Exame do coração'),
('Raio-X de Tórax', 'Imagem dos pulmões'),
('Ultrassom Abdominal', 'Imagem dos órgãos abdominais'),
('Mamografia', 'Exame das mamas')
ON CONFLICT DO NOTHING;