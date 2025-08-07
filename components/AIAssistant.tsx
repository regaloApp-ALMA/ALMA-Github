import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Animated } from 'react-native';
import { Send, Mic, MicOff, Leaf, Apple } from 'lucide-react-native';
import colors from '@/constants/colors';
import { Platform } from 'react-native';
import { useTreeStore } from '@/stores/treeStore';
import { useRouter } from 'expo-router';
import { useThemeStore } from '@/stores/themeStore';

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
};

type AIResponse = {
  type: 'branch' | 'fruit' | 'info';
  title?: string;
  description?: string;
  branchId?: string;
  categoryId?: string;
  tags?: string[];
  people?: string[];
  emotions?: string[];
  location?: string;
};

// Datos ficticios sobre familiares para respuestas de la IA
const familyData = {
  'mamá': {
    name: 'Ana María',
    age: 58,
    birthplace: 'Valencia',
    birthplaceDetails: 'una hermosa ciudad costera conocida por su Ciudad de las Artes y las Ciencias y la famosa paella valenciana. Creció en el barrio del Carmen, un área histórica llena de callejuelas estrechas y edificios coloridos.',
    occupation: 'Profesora de literatura',
    occupationDetails: 'en el instituto público García Lorca, donde ha inspirado a generaciones de estudiantes a amar la poesía y la narrativa española. Siempre dice que eligió esta profesión porque su propia profesora de literatura le cambió la vida cuando era adolescente.',
    hobbies: ['jardinería', 'lectura', 'cocina tradicional'],
    hobbyDetails: {
      'jardinería': 'Tiene un pequeño huerto urbano en la terraza donde cultiva hierbas aromáticas y tomates cherry. Dice que cuidar de las plantas le ayuda a desconectar del estrés diario.',
      'lectura': 'Es una ávida lectora de novela histórica y poesía contemporánea. Su libro favorito es "Cien años de soledad" de García Márquez, que ha leído al menos cinco veces.',
      'cocina': 'Ha perfeccionado recetas familiares que se transmiten desde su abuela. Su paella valenciana ha ganado concursos locales y es el plato estrella en todas las reuniones familiares.'
    },
    stories: [
      'Cuando era joven, ganó un concurso nacional de poesía con un poema sobre el mar Mediterráneo. El premio fue una beca para estudiar un verano en la Universidad de Salamanca, donde descubrió su pasión por la enseñanza.',
      'Conoció a tu padre durante un viaje a Granada en 1985, cuando ambos coincidieron en una visita guiada a la Alhambra. Ella siempre cuenta que fue amor a primera vista, aunque tu padre bromea diciendo que tuvo que invitarla a tres cafés antes de que aceptara salir con él.',
      'Siempre cuenta la historia de cuando te perdiste en el supermercado a los 4 años. Te encontró en la sección de dulces, tranquilamente sentado comiendo una chocolatina que habías abierto. En vez de regañarte, se sentó contigo y compartieron el chocolate antes de pagar por él.',
      'Su receta de paella valenciana ha ganado premios locales en festivales gastronómicos. El secreto, según ella, está en el caldo de pescado que prepara el día anterior y en el azafrán que trae especialmente de un pequeño pueblo de La Mancha.'
    ],
    memories: [
      'Los veranos en la playa de Cullera, donde alquilabais una pequeña casa cerca del mar. Recuerda especialmente las noches de estrellas en la playa y los castillos de arena que construíais juntos cada mañana.',
      'Sus tardes enseñándote a cocinar, especialmente la primera vez que hiciste una tortilla de patatas completamente solo. Aunque quedó un poco cruda en el centro, ella la proclamó como "la mejor tortilla del mundo" y la comió con orgullo.',
      'El viaje familiar a Roma por su 50 cumpleaños, donde visitasteis el Coliseo, la Fontana di Trevi y comisteis gelato en cada plaza. Guarda las monedas que lanzasteis a la fuente en una pequeña caja de recuerdos.',
      'Las Navidades en casa de la abuela Carmen, con toda la familia reunida alrededor de la mesa. Siempre menciona el olor a canela y naranja que impregnaba la casa y cómo la abuela insistía en que todos cantaran villancicos después de la cena.'
    ]
  },
  'papá': {
    name: 'Miguel',
    age: 60,
    birthplace: 'Granada',
    birthplaceDetails: 'una ciudad andaluza con una rica historia árabe y cristiana, famosa por la Alhambra y el barrio del Albaicín. Creció en una casa tradicional con patio interior cerca de la catedral, donde su familia vivía desde hace tres generaciones.',
    occupation: 'Arquitecto',
    occupationDetails: 'especializado en restauración de edificios históricos. Su pasión por preservar el patrimonio cultural le ha llevado a trabajar en proyectos por toda España, aunque su obra más reconocida es la rehabilitación del antiguo mercado de abastos de Madrid, que ahora es un espacio cultural.',
    hobbies: ['fotografía', 'senderismo', 'ajedrez'],
    hobbyDetails: {
      'fotografía': 'Comenzó con una vieja cámara analógica que heredó de su abuelo y ahora tiene una impresionante colección de equipos. Sus fotografías de paisajes urbanos han sido expuestas en pequeñas galerías locales.',
      'senderismo': 'Conoce como la palma de su mano todas las rutas de Sierra Nevada. Cada año organiza una excursión familiar a una cumbre diferente, una tradición que comenzó con su padre.',
      'ajedrez': 'Aprendió a jugar con su abuelo y ha transmitido esta pasión a toda la familia. Tiene un tablero de madera tallada que compró en un viaje a Rusia y que considera uno de sus tesoros más preciados.'
    },
    stories: [
      'Diseñó varios edificios emblemáticos en Madrid, incluyendo la renovación de una antigua fábrica que se convirtió en un centro cultural premiado internacionalmente. Siempre cuenta con orgullo cómo logró preservar la esencia industrial del edificio mientras lo adaptaba a su nuevo uso.',
      'De joven quería ser futbolista profesional y llegó a jugar en las categorías inferiores del Granada CF. Una lesión de rodilla truncó su carrera deportiva, pero eso le llevó a descubrir su verdadera vocación en la arquitectura. Siempre dice que aquella lesión fue "el mejor accidente" de su vida.',
      'Tiene una colección de cámaras antiguas que comenzó su abuelo, quien era fotógrafo aficionado en los años 40. La pieza más valiosa es una Leica de 1938 que todavía funciona y con la que toma fotografías en blanco y negro en ocasiones especiales.',
      'Siempre cuenta anécdotas de su época universitaria en Barcelona, especialmente sobre cómo él y sus compañeros pasaban noches enteras terminando maquetas para las entregas. Su profesor favorito, un arquitecto catalán muy reconocido, le enseñó que "la arquitectura no es construir edificios, sino crear espacios donde la vida sucede".'
    ],
    memories: [
      'Los domingos de senderismo en la sierra, donde te enseñaba los nombres de todas las plantas y árboles. Recuerda especialmente la primera vez que llegaste a una cumbre por ti mismo, sin necesitar que te llevara de la mano en los tramos difíciles.',
      'Sus lecciones de ajedrez cada tarde de invierno junto a la chimenea. Aunque al principio te dejaba ganar, pronto desarrollaste estrategias propias que le sorprendieron. Guarda con cariño el pequeño trofeo que ganaste en tu primer torneo escolar.',
      'El viaje sorpresa a Nueva York por su aniversario de bodas número 25, que organizasteis tú y tu hermana en secreto. Todavía se emociona al recordar su cara de asombro cuando le disteis los billetes de avión durante la cena familiar.',
      'Cuando te enseñó a montar en bicicleta en el parque cercano a casa. Después de muchas caídas y rodillas raspadas, finalmente conseguiste mantener el equilibrio. Celebrasteis el logro con un helado enorme que compartisteis sentados en un banco del parque.'
    ]
  },
  'laura': {
    name: 'Laura',
    age: 32,
    birthplace: 'Madrid',
    birthplaceDetails: 'donde nació en el Hospital La Paz una lluviosa tarde de octubre. Aunque es madrileña de nacimiento, siempre dice que se siente medio valenciana por la influencia de mamá y las largas temporadas que pasabais en la costa mediterránea durante su infancia.',
    occupation: 'Médico pediatra',
    occupationDetails: 'en el Hospital Infantil Niño Jesús, donde realiza una labor extraordinaria con niños con enfermedades crónicas. Eligió pediatría porque, según ella, "los niños son los pacientes más sinceros y valientes". Además de su trabajo clínico, colabora con una ONG que proporciona atención médica a niños en campos de refugiados.',
    hobbies: ['piano', 'natación', 'pintura'],
    hobbyDetails: {
      'piano': 'Comenzó a los 7 años y, aunque nunca quiso dedicarse profesionalmente a la música, mantiene esta pasión viva. Tiene un piano vertical en su apartamento y suele interpretar piezas de Chopin y Debussy para relajarse después de largas jornadas en el hospital.',
      'natación': 'Formó parte del equipo de natación del colegio y ganó varias medallas regionales. Ahora nada tres veces por semana y ha participado en travesías a nado en mar abierto por causas benéficas.',
      'pintura': 'Descubrió este hobby durante la universidad como forma de combatir el estrés de los estudios de medicina. Se especializa en acuarelas de paisajes y ha decorado su consulta con sus propias obras para crear un ambiente más acogedor para los niños.'
    },
    stories: [
      'Siempre quiso ser médico desde que tenía 5 años, cuando le regalaron un pequeño maletín de doctor de juguete. En vez de jugar con muñecas, te "diagnosticaba" a ti y a todos los miembros de la familia. Sus informes médicos infantiles, escritos con crayones de colores, están guardados en un álbum familiar.',
      'Ganó varias competiciones de natación en su juventud, incluyendo un campeonato regional de estilo libre. La medalla de oro está enmarcada en su despacho junto a su título de medicina, porque según ella, ambos logros le enseñaron el valor de la disciplina y la perseverancia.',
      'Vivió un año en Londres durante sus estudios, como parte de un programa de intercambio. Esa experiencia le abrió los ojos al mundo y le hizo valorar aún más sus raíces españolas. Todavía mantiene amistad con compañeros de aquella época y os visitáis mutuamente cada pocos años.',
      'Toca el piano desde los 7 años, cuando los abuelos le regalaron un piano vertical por su cumpleaños. Aunque nunca quiso ser música profesional, su interpretación de "Claro de Luna" de Debussy es tan emotiva que siempre consigue arrancar lágrimas en las reuniones familiares.'
    ],
    memories: [
      'Las peleas de almohadas cuando erais pequeños, que invariablemente terminaban con plumas por toda la habitación y vosotros riendo hasta que os dolía el estómago. Mamá fingía enfadarse, pero siempre acababa uniéndose a la diversión.',
      'Cuando os escapasteis juntos a un concierto sin permiso cuando tú tenías apenas 15 años. Ella te cubrió diciendo a vuestros padres que ibais a estudiar a casa de una amiga. Aunque finalmente confesasteis la verdad, ese pequeño acto rebelde creó un vínculo especial entre vosotros.',
      'Sus consejos durante tu época universitaria, especialmente cuando pasabas por momentos difíciles. Siempre sabía qué decir para animarte y ponía en perspectiva los problemas con su característica mezcla de pragmatismo y sensibilidad.',
      'El viaje que hicisteis juntos por Europa tras su graduación, mochila al hombro y con un presupuesto ajustado. Recorristeis Amsterdam, Berlín, Praga y Viena, durmiendo en hostales y comiendo en mercados locales. Todavía os reís recordando cómo os perdisteis en el metro de Berlín y acabasteis cenando kebabs a medianoche con un grupo de músicos callejeros.'
    ]
  },
  'abuela carmen': {
    name: 'Carmen',
    age: 82,
    birthplace: 'Salamanca',
    birthplaceDetails: 'específicamente en un pequeño pueblo llamado Candelario, famoso por sus calles empedradas, arquitectura tradicional y embutidos artesanales. Nació en la casa familiar, una construcción de piedra del siglo XVIII con balcones de madera tallada que aún pertenece a la familia, aunque ahora solo se utiliza en verano.',
    occupation: 'Jubilada (antes maestra)',
    occupationDetails: 'de escuela rural durante más de 40 años. Enseñó a varias generaciones de niños en un pequeño pueblo de la Sierra de Francia, donde era la única maestra y se encargaba de alumnos de todas las edades. Muchos de sus antiguos alumnos, ahora adultos con hijos propios, siguen visitándola y le agradecen haberles inculcado el amor por el conocimiento.',
    hobbies: ['ganchillo', 'cocina', 'cuidar de sus plantas'],
    hobbyDetails: {
      'ganchillo': 'Aprendió de su propia abuela y ha perfeccionado la técnica a lo largo de décadas. Sus manteles y colchas son obras de arte que ha regalado a toda la familia como tesoros para guardar y transmitir a futuras generaciones.',
      'cocina': 'Es guardiana de recetas familiares centenarias, especialmente de dulces tradicionales como las perrunillas y el hornazo. Su cuaderno de recetas, escrito a mano con una caligrafía perfecta, es considerado un tesoro familiar que algún día heredarás.',
      'plantas': 'Su pequeño patio está lleno de geranios, albahaca y hierbabuena. Conoce remedios naturales para casi cualquier dolencia y siempre tiene una infusión preparada para cada ocasión o malestar.'
    },
    stories: [
      'Vivió la posguerra y siempre cuenta historias de aquella época difícil, como cuando toda la familia compartía un solo huevo para la cena, o cómo intercambiaban ropa con los vecinos para que los niños pudieran tener algo diferente que ponerse en ocasiones especiales. A pesar de las dificultades, habla de aquellos tiempos con una mezcla de nostalgia y orgullo por la solidaridad que existía entre las personas.',
      'Conoció a tu abuelo en un baile de pueblo en 1958, durante las fiestas patronales. Él era de un pueblo vecino y había ido con amigos en bicicleta, recorriendo más de 20 kilómetros por caminos de tierra. Según cuenta, se fijó en ella porque era la única chica que se atrevió a contradecir al alcalde cuando este quiso acortar el baile. Tu abuelo siempre decía que se enamoró de su valentía antes que de su belleza.',
      'Enseñó a varias generaciones de niños en su escuela rural, donde era la única maestra para todos los cursos. Con recursos limitados, convertía la naturaleza en su principal herramienta educativa: las matemáticas se aprendían contando bellotas, la biología observando el ciclo vital de las plantas del huerto escolar, y la literatura a través de las historias y leyendas locales que recopilaba de los ancianos del pueblo.',
      'Guarda recetas familiares que tienen más de 100 años, transmitidas oralmente hasta que ella decidió escribirlas en un cuaderno para preservarlas. Su receta de hornazo (un pan relleno tradicional de Salamanca) es tan auténtica que el año pasado fue invitada a hacer una demostración en un festival gastronómico regional. Aunque compartió el proceso, admite con una sonrisa pícara que siempre omite un ingrediente secreto cuando da la receta a extraños.'
    ],
    memories: [
      'Sus galletas caseras cada vez que la visitabas, especialmente las de canela y limón que preparaba la mañana misma de tu llegada para que las disfrutaras recién horneadas. El aroma inundaba toda la casa y era la mejor bienvenida posible. Siempre guardaba una lata llena para que te llevaras a casa, envueltas cuidadosamente en papel de horno y con una nota cariñosa.',
      'Las historias que contaba junto a la chimenea durante las frías noches de invierno, sobre duendes que habitaban en los bosques cercanos o tesoros escondidos por los antiguos habitantes del pueblo. Tenía un don especial para la narración, modulando la voz y haciendo pausas dramáticas que te mantenían completamente cautivado.',
      'Cuando te enseñó a hacer ganchillo un verano que pasaste con ella tras fracturarte el brazo y no poder bañarte en el río con los otros niños. Al principio te resististe, pensando que era "cosa de chicas", pero su paciencia infinita y la satisfacción de crear algo con tus propias manos te conquistaron. Aún conservas el pequeño tapete que hiciste entonces, imperfecto pero valioso.',
      'Sus consejos de vida que siempre recordarás, como "el tiempo puesto en hacer las cosas bien nunca es tiempo perdido" o "la verdadera riqueza está en tener historias que contar, no cosas que mostrar". Los compartía mientras realizaba tareas cotidianas, como desgranar judías o regar las plantas, sin pretensión de estar dando lecciones importantes, pero con una sabiduría que solo dan los años y la experiencia.'
    ]
  }
};

const AIAssistant = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'system-1',
      role: 'system',
      content: 'Eres un asistente de ALMA, la app para crear y organizar recuerdos en un árbol de vida. Puedes ayudar a crear ramas (categorías) y frutos (recuerdos específicos). También puedes responder preguntas sobre los familiares del usuario basándote en la información de sus árboles compartidos.',
    },
    {
      id: '1',
      role: 'assistant',
      content: 'Hola, soy tu asistente de ALMA. Puedo ayudarte a crear ramas y recuerdos para tu árbol, o responder preguntas sobre tus familiares y sus recuerdos compartidos. ¿En qué puedo ayudarte hoy?',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const { addBranch, addFruit, tree } = useTreeStore();
  const router = useRouter();
  const { theme } = useThemeStore();
  const isDarkMode = theme === 'dark';
  
  // Animación para los puntos de "pensando"
  const dot1Opacity = useRef(new Animated.Value(0.4)).current;
  const dot2Opacity = useRef(new Animated.Value(0.4)).current;
  const dot3Opacity = useRef(new Animated.Value(0.4)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (isThinking) {
      // Animación de los puntos
      Animated.loop(
        Animated.sequence([
          // Primer punto
          Animated.timing(dot1Opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot1Opacity, {
            toValue: 0.4,
            duration: 400,
            useNativeDriver: true,
          }),
          // Segundo punto
          Animated.timing(dot2Opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot2Opacity, {
            toValue: 0.4,
            duration: 400,
            useNativeDriver: true,
          }),
          // Tercer punto
          Animated.timing(dot3Opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot3Opacity, {
            toValue: 0.4,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Detener animación
      dot1Opacity.setValue(0.4);
      dot2Opacity.setValue(0.4);
      dot3Opacity.setValue(0.4);
    }
  }, [isThinking]);

  // Scroll al final cuando se añaden nuevos mensajes
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    // Start the "thinking" animation
    setIsThinking(true);
    
    // Verificar si es una pregunta sobre un familiar
    const familyQuestion = checkFamilyQuestion(input);
    
    if (familyQuestion) {
      // Simular tiempo de respuesta de IA (entre 1.5 y 3 segundos)
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1500));
      
      // Generar respuesta local sobre el familiar
      const response = generateFamilyResponse(familyQuestion.familiar, familyQuestion.tipo);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsThinking(false);
      return;
    }
    
    setIsLoading(true);

    try {
      // Simular tiempo de respuesta de IA (entre 1.5 y 3 segundos)
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1500));
      
      const response = await sendToAI([...messages, userMessage]);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.completion,
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Try to parse AI response to extract structured data
      try {
        const parsedResponse = parseAIResponse(response.completion);
        if (parsedResponse) {
          setAiResponse(parsedResponse);
        }
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
      }
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo más tarde.',
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsThinking(false);
    }
  };

  // Función para verificar si es una pregunta sobre un familiar
  const checkFamilyQuestion = (question: string): { familiar: string, tipo: string } | null => {
    question = question.toLowerCase();
    
    // Buscar menciones a familiares
    const familiares = ['mamá', 'papá', 'laura', 'abuela carmen', 'madre', 'padre', 'hermana', 'abuela'];
    let familiarEncontrado = null;
    
    for (const familiar of familiares) {
      if (question.includes(familiar)) {
        // Normalizar nombres
        if (familiar === 'madre') familiarEncontrado = 'mamá';
        else if (familiar === 'padre') familiarEncontrado = 'papá';
        else if (familiar === 'hermana') familiarEncontrado = 'laura';
        else if (familiar === 'abuela') familiarEncontrado = 'abuela carmen';
        else familiarEncontrado = familiar;
        break;
      }
    }
    
    if (!familiarEncontrado) return null;
    
    // Determinar tipo de pregunta
    let tipo = 'general';
    if (question.includes('historia') || question.includes('anécdota') || question.includes('cuéntame sobre')) {
      tipo = 'historia';
    } else if (question.includes('recuerdo') || question.includes('memoria') || question.includes('momento')) {
      tipo = 'memoria';
    } else if (question.includes('afición') || question.includes('hobby') || question.includes('le gusta')) {
      tipo = 'hobby';
    } else if (question.includes('trabajo') || question.includes('profesión') || question.includes('ocupación')) {
      tipo = 'ocupación';
    } else if (question.includes('nació') || question.includes('origen') || question.includes('de dónde')) {
      tipo = 'origen';
    } else if (question.includes('edad') || question.includes('años') || question.includes('cumpleaños')) {
      tipo = 'edad';
    }
    
    return { familiar: familiarEncontrado, tipo };
  };

  // Función para generar respuestas detalladas sobre familiares
  const generateFamilyResponse = (familiar: string, tipo: string): string => {
    const data = familyData[familiar as keyof typeof familyData];
    if (!data) return `No tengo información sobre ${familiar} en este momento.`;
    
    // Generar respuestas más detalladas y conversacionales
    switch (tipo) {
      case 'historia':
        const historia = data.stories[Math.floor(Math.random() * data.stories.length)];
        return `Según el árbol compartido de ${data.name}, ${historia} Esta historia es muy especial para ${data.name} y la ha preservado en su árbol de vida con varias fotografías de aquella época. ¿Te gustaría saber más sobre otras experiencias importantes en la vida de ${data.name}?`;
      
      case 'memoria':
        const memoria = data.memories[Math.floor(Math.random() * data.memories.length)];
        return `En el árbol de ${data.name} hay un recuerdo muy especial sobre ${memoria} Este es uno de los momentos más significativos que ha decidido preservar en su árbol de vida, y lo ha etiquetado como "momentos que definen quién soy". Las fotografías que acompañan este recuerdo muestran una auténtica felicidad en su rostro. ¿Hay algún otro aspecto de la vida de ${data.name} sobre el que te gustaría saber más?`;
      
      case 'hobby':
        const hobbyIndex = Math.floor(Math.random() * data.hobbies.length);
        const hobby = data.hobbies[hobbyIndex];
        const hobbyDetail = data.hobbyDetails[hobby as keyof typeof data.hobbyDetails] || '';
        return `A ${data.name} le encanta ${hobby}, junto con ${data.hobbies.filter((h, i) => i !== hobbyIndex).join(' y ')}. ${hobbyDetail} Esta afición aparece como una rama importante en su árbol de vida, con numerosos recuerdos asociados. ¿Te gustaría que te cuente más sobre alguna de sus otras aficiones?`;
      
      case 'ocupación':
        return `${data.name} trabaja como ${data.occupation}. ${data.occupationDetails} Su carrera profesional ocupa una rama significativa en su árbol de vida, con recuerdos de logros, desafíos superados y momentos de crecimiento personal. ¿Te interesaría conocer cómo comenzó su trayectoria profesional o algún logro particular que haya compartido?`;
      
      case 'origen':
        return `${data.name} nació en ${data.birthplace}, ${data.birthplaceDetails} Sus raíces y origen son muy importantes para su identidad, y ha dedicado una sección especial en su árbol a los recuerdos de su infancia en este lugar. ¿Quieres saber más sobre cómo era su vida durante su infancia o sobre algún otro aspecto de sus orígenes?`;
      
      case 'edad':
        const cumpleañosProximo = new Date().getMonth() >= 6 ? 
          `Pronto cumplirá ${data.age + 1} años, en unos meses` : 
          `Acaba de cumplir ${data.age} años hace poco`;
        return `${data.name} tiene ${data.age} años actualmente. ${cumpleañosProximo}. En su árbol de vida ha marcado varios cumpleaños especiales como momentos significativos, especialmente su 50 cumpleaños cuando toda la familia organizó una sorpresa inolvidable. ¿Te gustaría conocer algún recuerdo específico de alguna celebración importante en su vida?`;
      
      default:
        // Respuesta general más detallada
        return `${data.name} tiene ${data.age} años y nació en ${data.birthplace}, ${data.birthplaceDetails.substring(0, 100)}... Trabaja como ${data.occupation} y entre sus aficiones favoritas están ${data.hobbies.join(', ')}. 

En su árbol compartido puedes encontrar historias fascinantes, como cuando ${data.stories[0].toLowerCase()} 

También ha preservado recuerdos especiales contigo, como ${data.memories[Math.floor(Math.random() * data.memories.length)].toLowerCase()}

Su árbol de vida refleja una persona con una rica historia personal y familiar. ¿Hay algún aspecto específico de la vida de ${data.name} sobre el que te gustaría profundizar?`;
    }
  };

  const sendToAI = async (messageHistory: Message[]): Promise<{ completion: string }> => {
    try {
      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messageHistory.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error calling AI API:', error);
      throw error;
    }
  };

  const parseAIResponse = (text: string): AIResponse | null => {
    // Look for patterns that indicate the AI is trying to create a branch or fruit
    if (text.includes('He creado una rama') || text.includes('Puedo crear una rama')) {
      // Extract branch information
      const titleMatch = text.match(/rama (?:llamada|para|sobre) ["']?([^"'.]+)["']?/i);
      const categoryMatch = text.match(/categoría (?:de|es) ["']?([^"'.]+)["']?/i);
      
      if (titleMatch) {
        return {
          type: 'branch',
          title: titleMatch[1].trim(),
          categoryId: categoryMatch ? mapCategoryToId(categoryMatch[1].trim()) : 'hobbies',
          description: text,
        };
      }
    }
    
    if (text.includes('He creado un recuerdo') || text.includes('Puedo añadir un recuerdo')) {
      // Extract fruit information
      const titleMatch = text.match(/recuerdo (?:llamado|sobre|titulado) ["']?([^"'.]+)["']?/i);
      const descriptionMatch = text.match(/descripción: ["']?([^"'.]+)["']?/i);
      const branchMatch = text.match(/rama (?:de|llamada|sobre) ["']?([^"'.]+)["']?/i);
      
      if (titleMatch) {
        // Find matching branch
        let branchId = '';
        if (branchMatch) {
          const branchName = branchMatch[1].trim().toLowerCase();
          const branch = tree.branches.find(b => 
            b.name.toLowerCase().includes(branchName) || 
            branchName.includes(b.name.toLowerCase())
          );
          if (branch) {
            branchId = branch.id;
          }
        }
        
        return {
          type: 'fruit',
          title: titleMatch[1].trim(),
          description: descriptionMatch ? descriptionMatch[1].trim() : '',
          branchId: branchId || tree.branches[0]?.id,
        };
      }
    }
    
    return null;
  };

  const mapCategoryToId = (category: string): string => {
    category = category.toLowerCase();
    if (category.includes('famil')) return 'family';
    if (category.includes('viaj')) return 'travel';
    if (category.includes('trabaj')) return 'work';
    if (category.includes('estud')) return 'education';
    if (category.includes('amig')) return 'friends';
    if (category.includes('mascot')) return 'pets';
    return 'hobbies';
  };

  const toggleRecording = () => {
    if (Platform.OS === 'web') {
      // Web doesn't support recording
      Alert.alert('La grabación de voz no está disponible en la versión web.');
      return;
    }
    
    setIsRecording(!isRecording);
    
    if (!isRecording) {
      // In a real app, this would start recording
      // For now, we'll just simulate it
      setTimeout(() => {
        setIsRecording(false);
        setInput('Crea una rama para mis viajes a Europa');
      }, 3000);
    }
  };

  const handleCreateFromAI = () => {
    if (!aiResponse) return;
    
    if (aiResponse.type === 'branch' && aiResponse.title) {
      // Create a new branch
      const categoryId = aiResponse.categoryId || 'hobbies';
      const category = tree.branches.find(b => b.categoryId === categoryId);
      
      addBranch({
        name: aiResponse.title,
        categoryId: categoryId,
        color: category?.color || colors.primary,
        isShared: false,
        position: {
          x: Math.random() * 0.6 + 0.2,
          y: Math.random() * 0.6 + 0.2,
        },
      });
      
      // Add confirmation message
      const confirmMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `¡He creado la rama "${aiResponse.title}" en tu árbol! Ahora puedes empezar a añadir recuerdos específicos a esta categoría. ¿Te gustaría que te ayude a crear algún recuerdo para esta nueva rama?`,
      };
      
      setMessages(prev => [...prev, confirmMessage]);
      setAiResponse(null);
      
    } else if (aiResponse.type === 'fruit' && aiResponse.title) {
      // Create a new fruit/memory
      const branchId = aiResponse.branchId || tree.branches[0]?.id;
      
      if (!branchId) {
        Alert.alert('Error', 'No hay ramas disponibles para añadir este recuerdo.');
        return;
      }
      
      addFruit({
        title: aiResponse.title,
        description: aiResponse.description || '',
        branchId: branchId,
        tags: aiResponse.tags || [],
        location: aiResponse.location ? { name: aiResponse.location } : undefined,
        people: aiResponse.people || [],
        emotions: aiResponse.emotions || [],
        isShared: false,
        position: {
          x: Math.random() * 0.6 + 0.2,
          y: Math.random() * 0.6 + 0.2,
        },
      });
      
      // Add confirmation message
      const confirmMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `¡He añadido el recuerdo "${aiResponse.title}" a tu árbol! Este recuerdo ahora forma parte de tu historia personal. ¿Hay algún otro recuerdo que te gustaría añadir o alguna otra forma en que pueda ayudarte a enriquecer tu árbol de vida?`,
      };
      
      setMessages(prev => [...prev, confirmMessage]);
      setAiResponse(null);
    }
  };

  // Render the thinking animation
  const renderThinkingIndicator = () => {
    if (!isThinking) return null;
    
    return (
      <View style={[styles.thinkingContainer, isDarkMode && styles.thinkingContainerDark]}>
        <Animated.View style={[styles.thinkingDot, { opacity: dot1Opacity }]} />
        <Animated.View style={[styles.thinkingDot, { opacity: dot2Opacity }]} />
        <Animated.View style={[styles.thinkingDot, { opacity: dot3Opacity }]} />
      </View>
    );
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <ScrollView 
        style={styles.messagesContainer}
        ref={scrollViewRef}
      >
        {messages.filter(m => m.role !== 'system').map(message => (
          <View 
            key={message.id} 
            style={[
              styles.messageBubble,
              message.role === 'user' ? styles.userMessage : styles.assistantMessage,
              message.role === 'assistant' && isDarkMode && styles.assistantMessageDark,
            ]}
          >
            <Text style={[
              styles.messageText,
              message.role === 'user' ? styles.userMessageText : styles.assistantMessageText,
              message.role === 'assistant' && isDarkMode && styles.assistantMessageTextDark
            ]}>
              {message.content}
            </Text>
          </View>
        ))}
        
        {isThinking && renderThinkingIndicator()}
        
        {isLoading && !isThinking && (
          <View style={[styles.loadingContainer, isDarkMode && styles.loadingContainerDark]}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={[styles.loadingText, isDarkMode && styles.loadingTextDark]}>Pensando...</Text>
          </View>
        )}
        
        {aiResponse && (
          <View style={[styles.aiResponseContainer, isDarkMode && styles.aiResponseContainerDark]}>
            <View style={styles.aiResponseHeader}>
              {aiResponse.type === 'branch' ? (
                <Leaf size={20} color={colors.primary} />
              ) : (
                <Apple size={20} color={colors.primary} />
              )}
              <Text style={[styles.aiResponseTitle, isDarkMode && styles.aiResponseTitleDark]}>
                {aiResponse.type === 'branch' ? 'Nueva Rama' : 'Nuevo Recuerdo'}
              </Text>
            </View>
            
            <Text style={[styles.aiResponseName, isDarkMode && styles.aiResponseNameDark]}>{aiResponse.title}</Text>
            
            {aiResponse.description && (
              <Text style={[styles.aiResponseDescription, isDarkMode && styles.aiResponseDescriptionDark]}>
                {aiResponse.description}
              </Text>
            )}
            
            <TouchableOpacity 
              style={styles.createButton}
              onPress={handleCreateFromAI}
            >
              <Text style={styles.createButtonText}>
                {aiResponse.type === 'branch' ? 'Crear Rama' : 'Añadir Recuerdo'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      
      <View style={[styles.inputContainer, isDarkMode && styles.inputContainerDark]}>
        <TextInput
          style={[styles.input, isDarkMode && styles.inputDark]}
          value={input}
          onChangeText={setInput}
          placeholder="Pregunta o pide crear algo..."
          placeholderTextColor={isDarkMode ? '#777' : colors.gray}
          multiline
        />
        
        <TouchableOpacity style={[styles.recordButton, isDarkMode && styles.recordButtonDark]} onPress={toggleRecording}>
          {isRecording ? (
            <MicOff size={20} color={colors.error} />
          ) : (
            <Mic size={20} color={isDarkMode ? colors.white : colors.primary} />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.sendButton,
            !input.trim() && styles.sendButtonDisabled,
            isDarkMode && !input.trim() && styles.sendButtonDisabledDark
          ]} 
          onPress={handleSend}
          disabled={!input.trim() || isThinking || isLoading}
        >
          <Send size={20} color={input.trim() && !isThinking && !isLoading ? colors.white : isDarkMode ? '#555' : colors.gray} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userMessage: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    backgroundColor: colors.white,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  assistantMessageDark: {
    backgroundColor: '#1E1E1E',
  },
  messageText: {
    fontSize: 16,
  },
  userMessageText: {
    color: colors.white,
  },
  assistantMessageText: {
    color: colors.text,
  },
  assistantMessageTextDark: {
    color: colors.white,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  loadingContainerDark: {
    backgroundColor: '#1E1E1E',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.textLight,
  },
  loadingTextDark: {
    color: '#AAA',
  },
  thinkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    width: 80,
    justifyContent: 'center',
  },
  thinkingContainerDark: {
    backgroundColor: '#1E1E1E',
  },
  thinkingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginHorizontal: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  inputContainerDark: {
    backgroundColor: '#1E1E1E',
    borderTopColor: '#333',
  },
  input: {
    flex: 1,
    backgroundColor: colors.lightGray,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  inputDark: {
    backgroundColor: '#333',
    color: colors.white,
  },
  recordButton: {
    marginLeft: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonDark: {
    backgroundColor: '#333',
  },
  sendButton: {
    marginLeft: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.lightGray,
  },
  sendButtonDisabledDark: {
    backgroundColor: '#333',
  },
  aiResponseContainer: {
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  aiResponseContainerDark: {
    backgroundColor: colors.primary + '30',
  },
  aiResponseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiResponseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginLeft: 8,
  },
  aiResponseTitleDark: {
    color: colors.primary,
  },
  aiResponseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  aiResponseNameDark: {
    color: colors.white,
  },
  aiResponseDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 12,
  },
  aiResponseDescriptionDark: {
    color: '#AAA',
  },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  createButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default AIAssistant;