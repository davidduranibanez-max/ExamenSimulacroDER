"""Candidatos de práctica independientes. No utiliza respuestas de otras preguntas.

La revisión docente es imprescindible: una mutación lingüística puede producir
una respuesta equivalente o válida en otro contexto. No certifica dificultad.
"""
import re, random, unicodedata, calendar

def key(text):
    text = unicodedata.normalize('NFKD', text.casefold())
    return re.sub(r'[^a-z0-9]', '', ''.join(c for c in text if not unicodedata.combining(c)))

PEOPLE = 'Platón|Aristóteles|Sócrates|Parménides|Heráclito|Demócrito|Epicuro|Zenón de Elea|Zenón de Citio|Anaxágoras|Anaximandro|Anaxímenes|Tales de Mileto|Pitágoras|Empédocles|Protágoras|Gorgias|Antístenes|Diógenes de Sinope|Plotino|Agustín de Hipona|Tomás de Aquino|Guillermo de Ockham|Anselmo de Canterbury|Duns Escoto|Roger Bacon|Francis Bacon|René Descartes|Baruch Spinoza|Gottfried Leibniz|John Locke|George Berkeley|David Hume|Immanuel Kant|Johann Fichte|Friedrich Schelling|Georg Hegel|Arthur Schopenhauer|Friedrich Nietzsche|Auguste Comte|Herbert Spencer|Karl Marx|Friedrich Engels|Edmund Husserl|Martin Heidegger|Jean-Paul Sartre|José Ortega y Gasset|Henri Bergson|Karl Jaspers|Max Scheler|Nicolai Hartmann|Bertrand Russell|Ludwig Wittgenstein|Karl Popper|Thomas Hobbes|Jean-Jacques Rousseau|Montesquieu|Jeremy Bentham|John Stuart Mill|Hans Kelsen|H. L. A. Hart|Ronald Dworkin|Gustav Radbruch|Rudolf von Ihering|Friedrich Carl von Savigny|Georg Jellinek|Georges Gurvitch|Léon Duguit|Maurice Hauriou|François Gény|Raymond Saleilles|Hermann Kantorowicz|Otto Gierke|Bernhard Windscheid|Georg Friedrich Puchta|Anton Thibaut|Rudolf Stammler|Giorgio Del Vecchio|Francesco Carnelutti|Giuseppe Chiovenda|Piero Calamandrei|Alf Ross|Karl Olivecrona|Axel Hägerström|Roscoe Pound|Oliver Wendell Holmes|Benjamin Cardozo|Eugen Ehrlich|Santi Romano|Norberto Bobbio|Luigi Ferrajoli|Robert Alexy|Carlos Cossio|Luis Recaséns Siches|Eduardo García Máynez|Manuel García Morente|Raúl Gutiérrez Sáenz|José Ferrater Mora|Xavier Zubiri|Jacques Maritain|Emmanuel Mounier|Blaise Pascal|Nicolás Malebranche|Christian Wolff|Christian Thomasius|Samuel Pufendorf|Hugo Grocio|Francisco Suárez|Francisco de Vitoria|Alberico Gentili|Jean Bodin|Marsilio de Padua|Nicolás de Cusa|Giambattista Vico|Cesare Beccaria|Gaetano Filangieri|Gabriel Tarde|Émile Durkheim|Max Weber|Talcott Parsons|Robert Merton|Michel Foucault|Jürgen Habermas|Hannah Arendt|Simone de Beauvoir|Paul Ricoeur|Jean Piaget|William James|Charles Peirce|John Dewey|Wilhelm Dilthey|Wilhelm Windelband|Heinrich Rickert|Ernst Cassirer|Ernst Mach|Rudolf Carnap|Moritz Schlick|A. J. Ayer|Gilbert Ryle|G. E. Moore'.split('|')

LAW = 'Derogación|Abrogación|Subrogación|Promulgación|Publicación|Sanción|Coacción|Coercibilidad|Imperatividad|Bilateralidad|Unilateralidad|Autonomía|Heteronomía|Interioridad|Exterioridad|Validez formal|Validez material|Vigencia|Eficacia|Costumbre delegada|Costumbre derogatoria|Costumbre secundum legem|Costumbre contra legem|Costumbre praeter legem|Jurisprudencia|Doctrina|Equidad|Analogía|Interpretación auténtica|Interpretación judicial|Interpretación doctrinal|Integración normativa|Aplicación normativa|Subsunción|Imputación|Supuesto jurídico|Consecuencia jurídica|Hecho jurídico|Acto jurídico|Negocio jurídico|Derecho subjetivo|Derecho objetivo|Derecho natural|Derecho positivo|Derecho vigente|Derecho público|Derecho privado|Derecho social|Derecho real|Derecho personal|Derecho relativo|Derecho absoluto|Derecho potestativo|Deber jurídico|Deber moral|Obligación civil|Obligación natural|Acción procesal|Pretensión procesal|Jurisdicción|Competencia|Legitimación|Capacidad de goce|Capacidad de ejercicio|Personalidad jurídica|Persona colectiva|Ficción jurídica|Patrimonio de destino|Reconocimiento estatal|Nacionalidad|Ciudadanía|Territorialidad|Extraterritorialidad|Irretroactividad|Retroactividad favorable|Ultraactividad|Expectativa jurídica|Derecho adquirido|Facultad jurídica|Situación jurídica concreta|Situación jurídica abstracta|Prescripción|Caducidad|Cosa juzgada|Litispendencia|Cumplimiento forzoso|Indemnización|Reparación del daño|Restitución|Pena|Medida de seguridad|Sanción premial|Sanción restitutoria|Sanción represiva|Norma perfecta|Norma imperfecta|Norma plus quam perfecta|Norma minus quam perfecta|Norma taxativa|Norma dispositiva|Norma supletoria|Norma permisiva|Norma prohibitiva|Norma prescriptiva|Norma declarativa|Norma de organización|Norma primaria|Norma secundaria|Principio de legalidad|Principio de proporcionalidad|Principio de igualdad|Principio de seguridad jurídica|Principio de publicidad|Principio de supremacía constitucional|Reserva de ley|Reserva jurisdiccional|Jerarquía normativa|Antinomia normativa|Laguna legal|Laguna axiológica|Imperio de la ley|Voluntad del legislador|Voluntad del intérprete|Voluntad del Estado|Razón práctica|Justicia distributiva|Justicia conmutativa|Justicia correctiva|Justicia legal|Discrecionalidad|Arbitrariedad|Tipicidad|Antijuridicidad|Culpabilidad|Imputabilidad|Axiología jurídica|Ontología jurídica|Epistemología jurídica|Dogmática jurídica|Técnica legislativa|Sistemática jurídica'.split('|')

PHILOSOPHY = 'Racionalismo|Empirismo|Idealismo trascendental|Idealismo absoluto|Realismo crítico|Realismo ingenuo|Materialismo histórico|Materialismo mecanicista|Monismo|Dualismo|Pluralismo|Escepticismo|Dogmatismo|Relativismo|Objetivismo|Subjetivismo|Positivismo|Neopositivismo|Pragmatismo|Fenomenología|Existencialismo|Personalismo|Intuicionismo|Intelectualismo|Apriorismo|Sensualismo|Nominalismo|Conceptualismo|Realismo de los universales|Atomismo|Estoicismo|Epicureísmo|Cinismo|Neoplatonismo|Escolástica|Patrística|Humanismo|Criticismo|Solipsismo|Determinismo|Indeterminismo|Fatalismo|Voluntarismo|Vitalismo|Historicismo|Estructuralismo|Hermenéutica|Dialéctica|Lógica formal|Lógica trascendental|Lógica simbólica|Ontología|Metafísica|Gnoseología|Epistemología|Axiología|Ética|Estética|Antropología filosófica|Teleología|Teología natural|Cosmología|Psicología racional|Causalidad|Finalidad|Sustancia|Accidente|Esencia|Existencia|Acto|Potencia|Forma|Materia|Idea|Concepto|Juicio|Razonamiento|Deducción|Inducción|Abducción|Intuición sensible|Intuición intelectual|Intuición emocional|Intuición volitiva|Análisis|Síntesis|Abstracción|Generalización|Experiencia|Percepción|Sensación|Representación|Memoria|Imaginación|Entendimiento|Razón|Voluntad|Conciencia|Intencionalidad|Apercepción|Categoría|Noúmeno|Fenómeno|A priori|A posteriori|Juicio analítico|Juicio sintético|Necesidad|Contingencia|Universalidad|Particularidad|Identidad|Contradicción|Tercero excluido|Razón suficiente|Verificación|Falsación|Consenso|Coherencia|Correspondencia|Evidencia|Verdad lógica|Verdad ontológica|Verdad pragmática|Verdad moral|Libertad|Autonomía|Heteronomía|Responsabilidad|Deber|Virtud|Felicidad|Utilidad|Bien común|Dignidad|Justicia|Templanza|Prudencia|Fortaleza|Moderación|Hábito|Valor objetivo|Valor subjetivo|Ley moral|Imperativo hipotético|Imperativo categórico|Ética formal|Ética material|Ética de fines|Ética de bienes|Ética de deberes'.split('|')

INSTITUTIONS = 'Tribunal Supremo de Justicia|Tribunal Constitucional Plurinacional|Tribunal Agroambiental|Consejo de la Magistratura|Tribunal Supremo Electoral|Asamblea Legislativa Plurinacional|Cámara de Diputados|Cámara de Senadores|Presidencia del Estado|Vicepresidencia del Estado|Ministerio de Justicia|Ministerio de Gobierno|Ministerio de la Presidencia|Ministerio de Economía y Finanzas Públicas|Ministerio de Planificación del Desarrollo|Ministerio de Trabajo|Ministerio de Educación|Ministerio de Relaciones Exteriores|Ministerio de Defensa|Ministerio de Salud|Ministerio de Culturas|Ministerio de Desarrollo Rural|Ministerio de Obras Públicas|Ministerio de Medio Ambiente|Ministerio de Desarrollo Productivo|Ministerio de Minería|Ministerio de Hidrocarburos|Procuraduría General del Estado|Contraloría General del Estado|Defensoría del Pueblo|Fiscalía General del Estado|Banco Central de Bolivia|Autoridad de Fiscalización del Sistema Financiero|Servicio de Impuestos Nacionales|Aduana Nacional|Instituto Nacional de Estadística|Instituto Nacional de Reforma Agraria|Autoridad de Regulación de Telecomunicaciones|Autoridad de Fiscalización de Pensiones|Servicio General de Identificación Personal|Servicio Plurinacional de Registro de Comercio|Servicio de Registro Cívico|Archivo y Biblioteca Nacionales|Escuela de Jueces del Estado|Escuela de Gestión Pública Plurinacional|Gobierno Autónomo Departamental|Gobierno Autónomo Municipal|Gobierno Autónomo Regional|Gobierno Autónomo Indígena Originario Campesino|Asamblea Departamental|Concejo Municipal|Tribunal Departamental de Justicia|Tribunal Electoral Departamental|Juzgado Público Civil|Juzgado Público de Familia|Juzgado de Instrucción Penal|Juzgado de Sentencia Penal|Tribunal de Sentencia|Juzgado Agroambiental|Fiscalía Departamental|Dirección Departamental de Educación|Dirección Departamental de Trabajo|Comité Ejecutivo de la Universidad Boliviana|Congreso Nacional de Universidades|Conferencia Nacional de Universidades|Consejo Universitario|Honorable Consejo Universitario|Consejo Facultativo|Consejo de Carrera|Asamblea General Docente Estudiantil|Congreso Universitario|Rectorado|Vicerrectorado|Decanato|Vicedecanato|Dirección de Carrera|Secretaría General de la Universidad|Secretaría Académica|Dirección Administrativa Financiera|Comisión Académica|Comisión Económica|Comisión Institucional|Comisión de Investigación|Comisión de Extensión|Comisión de Evaluación|Instituto de Investigación|Departamento de Posgrado|Departamento de Planificación|Unidad de Bienestar Estudiantil|Unidad de Kardex|Unidad de Admisión Facultativa|Asociación de Docentes|Federación Universitaria Local|Federación Universitaria de Docentes|Centro de Estudiantes|Asamblea de Carrera|Asamblea Facultativa|Dirección de Investigación|Consejo de Posgrado|Consejo de Investigación|Dirección de Relaciones Internacionales|Dirección de Interacción Social|Comisión de Régimen Académico|Comisión de Régimen Estudiantil|Comisión de Régimen Docente|Secretaría de Vinculación|Comisión de Ética|Tribunal de Honor|Comisión Electoral Universitaria|Comité de Acreditación|Comisión de Admisión|Comisión de Titulación|Comisión de Extensión Cultural|Consejo de Biblioteca|Unidad de Archivo|Departamento de Publicaciones|Consejo de Asesoría Jurídica|Dirección de Asuntos Jurídicos|Comisión de Presupuesto|Comisión de Infraestructura|Consejo Social Universitario|Departamento de Evaluación|Comisión de Planificación'.split('|')

HISTORY = 'La encomienda|La mita|El repartimiento|El corregimiento|La intendencia|La audiencia|El cabildo|El virreinato|La capitanía general|El patronato real|El mayorazgo|El quinto real|La alcabala|El diezmo|El tributo indígena|El estanco|La Casa de Contratación|El Consejo de Indias|La reducción|La evangelización|La visita general|La residencia|La composición de tierras|El resguardo|La hacienda|La comunidad indígena|El ayllu|La marka|La reciprocidad|La redistribución|La conquista|La colonización|La pacificación|La resistencia|La rebelión|La emancipación|La independencia|La reforma|La revolución|La restauración|La contrarreforma|La centralización|La secularización|La industrialización|La urbanización|La nacionalización|La privatización|La descentralización|La federalización|La municipalización|La servidumbre|La esclavitud|El trabajo asalariado|El trabajo comunal|El trabajo forzoso|La producción manufacturera|El mercantilismo|El liberalismo económico|El proteccionismo|El librecambismo|El monopolio comercial|El comercio triangular|La trata esclavista|La acumulación originaria|La división del trabajo|El capitalismo comercial|El capitalismo industrial|El imperialismo|El colonialismo|El neocolonialismo|El nacionalismo|El internacionalismo|El socialismo|El anarquismo|El sindicalismo|El corporativismo|El fascismo|El absolutismo|El constitucionalismo|El parlamentarismo|El republicanismo|El monarquismo|El feudalismo|El vasallaje|El clientelismo|El caciquismo|El caudillismo|El militarismo|El presidencialismo|El reformismo|El constitucionalismo social|El sufragio censitario|El sufragio universal|El voto corporativo|La democracia directa|La democracia representativa|La soberanía popular|La soberanía monárquica|La soberanía nacional|La soberanía compartida|El equilibrio de poderes|La separación de poderes|La concentración del poder|La guerra de posiciones|La guerra de movimientos|La guerra de desgaste|La neutralidad armada|La coexistencia pacífica|La paz armada|La política de contención|La política de distensión|La doctrina de seguridad nacional|La alianza defensiva|La alianza ofensiva|La coalición continental|La intervención extranjera|La ocupación militar|La anexión territorial|La cesión territorial|El protectorado|El mandato internacional|La independencia tutelada|La autonomía provincial|La confederación|La federación|La unión personal|La unión dinástica|El Estado unitario|El Estado compuesto|El sistema de castas|El sistema estamental|La sociedad de clases|La estratificación social|La diferenciación laboral|La división territorial|La expansión marítima|La expansión continental'.split('|')

# Each replacement changes a substantive atom in the original answer.
MUTATIONS = {
 'autónom': ['heterónom', 'jerárquic', 'centralizad', 'delegad', 'subordinad'],
 'heterónom': ['autónom', 'voluntari', 'espontáne', 'consensuad', 'descentralizad'],
 'públic': ['privad', 'individual', 'corporativ', 'patrimonial', 'comunal'],
 'privad': ['públic', 'colectiv', 'estatal', 'institucional', 'comunitari'],
 'jurídic': ['moral', 'religios', 'consuetudinari', 'social', 'polític'],
 'moral': ['jurídic', 'polític', 'económic', 'estétic', 'religios'],
 'objetiv': ['subjetiv', 'relativ', 'individual', 'convencional', 'contingente'],
 'subjetiv': ['objetiv', 'absolut', 'universal', 'necesari', 'trascendental'],
 'absolut': ['relativ', 'condicionad', 'limitad', 'derivad', 'contingente'],
 'relativ': ['absolut', 'incondicionad', 'universal', 'ilimitad', 'necesari'],
 'general': ['particular', 'individual', 'especial', 'singular', 'excepcional'],
 'individual': ['general', 'colectiv', 'universal', 'comunitari', 'corporativ'],
 'universal': ['particular', 'singular', 'regional', 'sectorial', 'limitad'],
 'formal': ['material', 'sustantiv', 'empíric', 'práctic', 'causal'],
 'material': ['formal', 'procedimental', 'ideal', 'abstract', 'subjetiv'],
 'derecho': ['deber', 'privilegio', 'interés', 'poder', 'mandato', 'permiso'],
 'deber': ['derecho', 'facultad', 'permiso', 'interés', 'privilegio'],
 'obligación': ['facultad', 'potestad', 'expectativa', 'prohibición', 'autorización'],
 'facultad': ['obligación', 'prohibición', 'expectativa', 'sanción', 'responsabilidad'],
 'ley': ['costumbre', 'jurisprudencia', 'doctrina', 'equidad', 'convención'],
 'norma': ['sentencia', 'costumbre', 'directiva', 'resolución', 'convención'],
 'interpretación': ['integración', 'derogación', 'aplicación', 'promulgación', 'codificación'],
 'integración': ['interpretación', 'aplicación', 'subsunción', 'derogación', 'unificación'],
 'sanción': ['premio', 'autorización', 'exención', 'restitución', 'reconocimiento'],
 'coacción': ['persuasión', 'adhesión', 'conciliación', 'mediación', 'convicción'],
 'Estado': ['municipio', 'gobierno', 'sindicato', 'particular', 'partido'],
 'legislativ': ['ejecutiv', 'judicial', 'electoral', 'administrativ', 'constitucional'],
 'ejecutiv': ['legislativ', 'judicial', 'electoral', 'municipal', 'constitucional'],
 'judicial': ['administrativ', 'legislativ', 'ejecutiv', 'electoral', 'consultiv'],
 'nacional': ['departamental', 'municipal', 'regional', 'provincial', 'internacional'],
 'electoral': ['judicial', 'legislativ', 'administrativ', 'disciplinari', 'consultiv'],
 'reconoc': ['neg', 'revoc', 'limit', 'suspend', 'condicion'],
 'permit': ['prohíb', 'restring', 'condicion', 'excluy', 'suspend'],
 'prohib': ['autoriz', 'permit', 'promov', 'reconoc', 'garantiz'],
 'necesari': ['contingente', 'opcional', 'eventual', 'accidental', 'condicionad'],
 'democr': ['aristocr', 'teocr', 'autocr', 'meritocr', 'tecnocr'],
 'agricultura': ['ganadería itinerante', 'caza especializada', 'recolección estacional', 'pesca extractiva', 'minería rudimentaria'],
 'arqueología': ['paleontología', 'etnología', 'geología', 'epigrafía', 'antropología física'],
 'razón': ['experiencia', 'intuición', 'voluntad', 'sensación', 'percepción'],
 'experiencia': ['razón', 'revelación', 'deducción', 'intuición', 'tradición'],
 'esencia': ['existencia', 'apariencia', 'accidente', 'forma', 'sustancia'],
 'existencia': ['esencia', 'potencia', 'posibilidad', 'necesidad', 'apariencia'],
 'libertad': ['necesidad', 'coacción', 'determinación', 'subordinación', 'dependencia'],
 'igualdad': ['jerarquía', 'equivalencia', 'uniformidad', 'proporcionalidad', 'diferenciación'],
 'constitución': ['ley ordinaria', 'ley orgánica', 'resolución', 'decreto', 'reglamento'],
 'soberan': ['delegad', 'subordinad', 'autónom', 'dependiente', 'limitad'],
 'bilateral': ['unilateral', 'multilateral', 'recíproc', 'independiente', 'asimétric'],
 'unilateral': ['bilateral', 'recíproc', 'multilateral', 'correlativ', 'simétric'],
 'interior': ['exterior', 'colectiv', 'institucional', 'procedimental', 'material'],
 'exterior': ['interior', 'individual', 'subjetiv', 'moral', 'intencional'],
 'retroactiv': ['irretroactiv', 'ultraactiv', 'inmediat', 'diferid', 'anticipad'],
 'concret': ['abstract', 'general', 'hipotétic', 'potencial', 'eventual'],
 'abstract': ['concret', 'individual', 'efectiv', 'material', 'real'],
 'nacimiento': ['mayoría de edad', 'inscripción registral', 'reconocimiento judicial', 'emancipación', 'naturalización'],
 'muerte': ['incapacidad', 'ausencia', 'suspensión de derechos', 'interdicción', 'pérdida de ciudadanía'],
}

STEMS = set('heterónom jerárquic centralizad delegad subordinad autónom voluntari espontáne consensuad descentralizad privad corporativ patrimonial comunal públic colectiv estatal institucional comunitari jurídic religios social polític económic estétic relativ individual convencional contingente objetiv absolut universal necesari incondicionad limitad derivad condicionad particular especial singular excepcional formal material sustantiv empíric práctic causal procedimental ideal abstract legislativ ejecutiv judicial electoral administrativ municipal constitucional departamental nacional provincial internacional disciplinari consultiv opcional eventual accidental aristocr teocr autocr meritocr tecnocr recíproc independient asimétric multilateral bilateral unilateral simétric interior exterior intencional irretroactiv ultraactiv inmediat diferid anticipad concret general efectiv real hipotétic potencial soberan dependiente'.split())

MUTATIONS.update({
    'masas': ['élites', 'corporaciones', 'organizaciones', 'minorías', 'instituciones'],
    'obreras': ['empresariales', 'profesionales', 'gremiales', 'aristocráticas', 'comerciales'],
    'campesinas': ['empresariales', 'mercantiles', 'industriales', 'burocráticas', 'corporativas'],
    'medias': ['dirigentes', 'dominantes', 'empresariales', 'administrativas', 'patrimoniales'],
    'asumiendo': ['tutelando', 'subordinando', 'condicionando', 'excluyendo', 'supervisando'],
    'intereses': ['mandatos', 'privilegios', 'reglamentos', 'estatutos', 'compromisos'],
    'objetivos': ['procedimientos', 'reglamentos', 'mandatos', 'patrimonios', 'privilegios'],
    'históricos': ['administrativos', 'corporativos', 'patrimoniales', 'institucionales', 'territoriales'],
    'sociales': ['individuales', 'corporativos', 'patrimoniales', 'comerciales', 'territoriales'],
    'social': ['individual', 'corporativo', 'patrimonial', 'comercial', 'territorial'],
    'cultura': ['confederación', 'comunidad', 'jefatura', 'tradición', 'organización'],
    'guerra': ['negociación', 'mediación', 'capitulación', 'insurrección', 'intervención'],
    'revolución': ['restauración', 'reforma', 'insurrección', 'transición', 'ocupación'],
    'colonial': ['republicano', 'virreinal', 'precolonial', 'federal', 'constitucional'],
    'indígenas': ['criollas', 'mestizas', 'españolas', 'urbanas', 'corporativas'],
    'territorio': ['distrito', 'dominio', 'protectorado', 'departamento', 'cantón'],
    'población': ['administración', 'aristocracia', 'comunidad', 'burguesía', 'corporación'],
    'mayoría': ['minoría', 'totalidad', 'pluralidad', 'mitad', 'unanimidad'],
    'minoría': ['mayoría', 'totalidad', 'pluralidad', 'mitad', 'unanimidad'],
    'justicia': ['legalidad', 'equidad', 'jurisdicción', 'competencia', 'legitimidad'],
    'propiedad': ['posesión', 'tenencia', 'administración', 'disposición', 'custodia'],
    'trabajo': ['capital', 'patrimonio', 'comercio', 'consumo', 'tributo'],
    'producción': ['distribución', 'circulación', 'acumulación', 'recaudación', 'exportación'],
    'intervención': ['supervisión', 'delegación', 'sustitución', 'mediación', 'representación'],
    'participación': ['designación', 'representación', 'delegación', 'subordinación', 'fiscalización'],
    'protección': ['supervisión', 'fiscalización', 'regulación', 'administración', 'intervención'],
    'reconocimiento': ['otorgamiento', 'delegación', 'restricción', 'autorización', 'suspensión'],
    'investigación': ['fiscalización', 'acreditación', 'capacitación', 'evaluación', 'supervisión'],
    'formación': ['habilitación', 'acreditación', 'certificación', 'selección', 'evaluación'],
    'enseñanza': ['acreditación', 'investigación', 'extensión', 'especialización', 'certificación'],
    'obligatoria': ['facultativa', 'supletoria', 'condicional', 'temporal', 'delegada'],
    'obligatorio': ['facultativo', 'supletorio', 'condicional', 'temporal', 'delegado'],
    'gratuita': ['subvencionada', 'arancelada', 'condicionada', 'delegada', 'patrocinada'],
    'permanente': ['temporal', 'transitorio', 'excepcional', 'provisional', 'condicional'],
    'competencia': ['jurisdicción', 'legitimación', 'personería', 'representación', 'titularidad'],
    'administración': ['legislación', 'jurisdicción', 'planificación', 'fiscalización', 'representación'],
    'función': ['competencia', 'atribución', 'obligación', 'potestad', 'facultad'],
    'relación': ['subordinación', 'correlación', 'dependencia', 'identificación', 'representación'],
    'organización': ['representación', 'fiscalización', 'regulación', 'coordinación', 'administración'],
    'sociedad': ['corporación', 'comunidad', 'administración', 'institución', 'organización'],
    'sistema': ['procedimiento', 'régimen', 'método', 'ordenamiento', 'modelo'],
    'concepto': ['juicio', 'razonamiento', 'principio', 'axioma', 'postulado'],
    'conocimiento': ['razonamiento', 'entendimiento', 'juicio', 'principio', 'método'],
    'pensamiento': ['conocimiento', 'entendimiento', 'razonamiento', 'principio', 'juicio'],
    'valor': ['deber', 'fin', 'bien', 'interés', 'principio'],
    'valores': ['deberes', 'fines', 'bienes', 'intereses', 'principios'],
    'derechos': ['privilegios', 'permisos', 'intereses', 'mandatos', 'deberes'],
    'obligaciones': ['facultades', 'potestades', 'expectativas', 'prohibiciones', 'autorizaciones'],
    'esenciales': ['accidentales', 'eventuales', 'contingentes', 'condicionales', 'circunstanciales'],
    'fundamentales': ['complementarios', 'accesorios', 'derivados', 'condicionales', 'delegados'],
})

def inflect(replacement, suffix):
    if replacement in STEMS and suffix in ['o','a','os','as','os','as','ico','ica','icos','icas','acia','ático','ática','áticos','áticas']:
        return replacement + suffix
    if suffix in ['os','as'] and ' ' not in replacement and not replacement.endswith('s'):
        return replacement + ('es' if replacement[-1] not in 'aeiou' else 's')
    return replacement

def mutations(answer):
    results = []
    for root, substitutes in MUTATIONS.items():
        if root in ['reconoc','permit','prohib']: continue
        for match in re.finditer(r'\b' + re.escape(root) + r'\w*\b', answer, re.I):
            suffix = match.group()[len(root):]
            for substitute in substitutes:
                replacement = inflect(substitute, suffix)
                if match.group()[0].isupper(): replacement = replacement[0].upper() + replacement[1:]
                results.append(answer[:match.start()] + replacement + answer[match.end():])
    months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
    date = re.search(r'\b(\d{1,2}) de (' + '|'.join(months) + r') de (\d{4})\b', answer, re.I)
    if date:
        day, month, year = int(date[1]), months.index(date[2].lower())+1, int(date[3])
        for year_offset in range(-3,4):
            for day_offset in range(-10,11):
                new_year, new_day = year+year_offset, day+day_offset
                if (year_offset or day_offset) and 1 <= new_day <= calendar.monthrange(new_year,month)[1]:
                    results.append(answer[:date.start()] + f'{new_day} de {date[2]} de {new_year}' + answer[date.end():])
        return results
    for match in re.finditer(r'\b\d[\d.]*\b', answer):
        try: number = int(match.group().replace('.', ''))
        except ValueError: continue
        for distance in range(1, 121):
            for direction in [-1, 1]:
                alternative = number + direction * distance
                if alternative < 0: continue
                display = f'{alternative:,}'.replace(',', '.') if '.' in match.group() else str(alternative)
                results.append(answer[:match.start()] + display + answer[match.end():])
    return results

def candidate_family(row):
    a, q = row['answer'], row['question']
    # Select candidates by the question's requested entity, not other answers.
    if re.search(r'autor|filósofo|pensador|quién|nombre.*(señala|menciona)|expositor|jurista|personaje|presidente|líder|teórico', q, re.I) and len(a.split()) < 12:
        return PEOPLE
    if re.search(r'órgano|autoridad|institución|tribunal|cámara|consejo|instancia|organismo', q, re.I) and len(a.split()) < 15:
        return INSTITUTIONS
    if row['slug'] in ['filosofia', 'etica']: return PHILOSOPHY
    if row['slug'] in ['derecho', 'constitucion', 'regimen-universitario']: return LAW
    return HISTORY

def generate(row, curated=None):
    answer = row['answer']; result = []; seen = {key(answer)}
    def add(text):
        text = re.sub(r'\s+', ' ', text).strip()
        if not text.endswith(('.', '!', '?')): text += '.'
        normalized = key(text)
        if normalized and normalized not in seen:
            seen.add(normalized); result.append(text)
    for text in curated or []: add(text)
    changes = mutations(answer)
    for text in changes: add(text)
    # For extended responses, combinations of two substantive changes preserve
    # the context and length instead of adding generic or giveaway qualifiers.
    if len(result) < 100 and len(answer.split()) > 12:
        for changed in changes[:25]:
            for text in mutations(changed): add(text)
            if len(result) >= 140: break
    family = candidate_family(row)
    ranked = sorted(family, key=lambda text: (abs(len(text) - len(answer)), key(text)))
    if row['number'] == 1:
        ranked = [f'La práctica de {activity} {qualifier}.' for activity in ['la caza', 'la recolección', 'la pesca', 'la extracción de sal', 'el pastoreo', 'el intercambio', 'la alfarería', 'la minería', 'la talla lítica', 'la navegación'] for qualifier in ['itinerante', 'estacional', 'especializada', 'comunal', 'ritual', 'intensiva', 'seminómada', 'territorial', 'de subsistencia', 'trashumante']]
    elif row['number'] == 2:
        ranked = [f'El {feature} de {place}.' for feature in ['estrecho', 'paso', 'corredor', 'puente terrestre', 'istmo'] for place in ['Anián', 'Magallanes', 'Drake', 'Davis', 'Hudson', 'Frobisher', 'Nares', 'Dinamarca', 'Belle Isle', 'Juan de Fuca', 'Florida', 'Yucatán', 'Panamá', 'Torres', 'Malaca', 'Sunda', 'Lombok', 'Gibraltar', 'Ormuz', 'Bab el-Mandeb']]
    for text in ranked: add(text)
    if len(result) < 100: raise ValueError(f"No se consiguieron 100 candidatos únicos para {row['id']}: {len(result)}")
    # The 100 strings are owned by this question and stored directly in its JSON.
    result = result[:100]
    random.Random(row['id']).shuffle(result)
    return result
