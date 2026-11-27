/**
 * FAQ data — `/faqs`.
 *
 * The sixteen questions and answers are stakeholder-owned copy supplied
 * verbatim on 2026-11-27 (`src/data/faqs.txt`, since removed). They replace
 * the six PRD §8 seed questions that shipped with the `PENDIENTE` placeholder
 * state — the launch blocker is now closed.
 *
 * The rest of the data layer is typed TS, so the source stays `faqs.ts`
 * (deviation from the `faqs.json` the PRD §8 mentions, recorded in
 * `odd/tasks/damero-propiedades-faqs.md` ruling R7).
 *
 * The landing's FAQ teaser derives its questions from this module so the two
 * surfaces can never drift (R7 handoff).
 */

export interface FaqEntry {
  /** Question in Spanish, verbatim, in the stakeholder's order. */
  question: string;
  /**
   * Stakeholder-owned answer (PRD §8), verbatim. Never invented by an agent:
   * no legal, notarial, credit, tax or tenancy statement may be written by
   * anyone but the stakeholder (docs/DESIGN.md §17.3:729, §11).
   */
  answer: string;
}

/** §17.3:727 pending marker — kept for robustness, no entry uses it today. */
export const FAQ_PENDING_MARKER = 'PENDIENTE';

/**
 * §17.3:728 neutral meta line: states the scope (the question's topic) and
 * the expected length (a brief paragraph) of the answer still to be written.
 * It carries no advice of any kind. Kept for robustness, no entry uses it
 * today.
 */
export const FAQ_PENDING_META =
  'Respuesta en preparación: va a cubrir el tema de esta consulta en un párrafo breve.';

export const FAQ_ENTRIES: readonly FaqEntry[] = [
  {
    question:
      '¿Por qué me conviene contratar a una inmobiliaria en lugar de publicar y vender o alquilar mi propiedad por mi cuenta en redes sociales?',
    answer:
      'Principalmente porque la inmobiliaria, con el aval del CCI (Colegio de Corredores Inmobiliarios) te brinda la seguridad y confianza legal necesaria, no solo en cuanto al control de los avales de los interesados en la compra o alquiler, sino también cuidando y resguardando tu patrimonio bajo tu tutela y permiso, y principalmente interviniendo y asesorando en la negociación en los términos adecuados para la mejor finalización del negocio. Hacerlo por tu cuenta implica el riesgo de saltarse por desconocimiento los pasos que hacen que tu negocio sea seguro.',
  },
  {
    question: 'Cuál es el costo de publicar mi propiedad con ustedes?',
    answer:
      'Luego de tu permiso, no necesitás abonar publicación, promoción ni disponibilidad de asesoramiento. El servicio solo se paga al momento del cierre del negocio, siendo el monto de los honorarios el 3% del total negociado. En el caso que se llegue al límite del permiso sin lograr el cierre, no es necesario abonar nada pero siempre podés extender el permiso de venta o evaluar otras alternativas.',
  },
  {
    question: 'Qué debo tener al momento de negociar mi propiedad?',
    answer:
      'Lo mas importante es demostrar que sos dueño y acreditar tu identidad y asegurar que tu propiedad está en condiciones de ser vendida. Además, todos los propietarios que figuren en el título deben estar de acuerdo en realizar el negocio (por ejemplo, marido y mujer) Puede darse el caso de propietarios fallecidos y herederos no declarados; no te preocupes, te asesoramos qué debés realizar en cualquiera de los casos que se presente. Sirven planos de construcción, planos parcelarios, impuestos como la TGI y API y servicios como el de agua. Todo ello facilita el proceso para poder ofrecer la propiedad en menor tiempo.',
  },
  {
    question:
      '¿Cómo se determina el precio real de venta o alquiler de mi propiedad sin ilusionarme con un valor imposible?',
    answer:
      'En Damero tenemos las herramientas y el conocimiento como para darte el precio que el mercado inmobiliario estaría dispuesto a pagar por tu propiedad, ni más ni menos. Evaluamos la zona, el estado de la propiedad, el tamaño del lote, potenciales aprovechamientos residenciales o comerciales, y el monto de negocios ya realizados en propiedades similares en la zona, o en zonas equivalentes. Es necesario que sepas que poner un precio alto o irreal, en la mayoría de los casos solo ralentiza el negocio y aleja a los compradores interesados.',
  },
  {
    question:
      'Llegado el caso, un interesado me ofrece otra propiedad como parte de pago, un vehículo o un plan de cuotas. Qué debo hacer?',
    answer:
      'En Damero te asesoramos según tus intereses. Si lo que te proponen es coherente y a vos como propietario te sirve, cerramos el negocio asegurandonos de que los términos propuestos sean entendidos, firmados y garantizados para que ambas partes logren el éxito en la concreción de la venta.',
  },
  {
    question:
      '¿Tengo que dejar mi casa disponible todo el tiempo para las visitas o puedo coordinar días y horarios específicos?',
    answer:
      'Vas a estar en conocimiento cada vez que uno o mas interesados quieran ver la propiedad, por lo que siempre se puede coordinar, tanto dias u horarios específicos o con la antelación necesaria para que, de ser necesario, puedas preparar la propiedad.',
  },
  {
    question:
      'Qué gastos además de los honorarios se pagan al momento de comprar o vender una propiedad?',
    answer:
      'Descontando el precio mismo de la propiedad y los honorarios de la inmobiliaria, el siguiente monto a considerar es el relacionado a la inscripción de la propiedad en el registro, tarea que realiza el escribano seleccionado por la parte compradora. Es un porcentaje de la propiedad que según usos y costumbres ⅓ lo abona la parte vendedora y ⅔ la parte compradora. Pueden agregarse otros montos, pero dependiendo de factores como pago de impuestos atrasados o finalización de sucesorios, cada caso es distinto. Siempre vas a saber antes exactamente cuanto hay que abonar, y evaluar hasta donde esos montos son negociables.',
  },
  {
    question:
      'Si quiero vender mi casa, pero vivo en ella y debo comprar otra antes de abandonarla. Cuál es el procedimiento?',
    answer:
      'Ese caso es muy normal y lo que se hace usualmente es promocionarla en forma “condicionada” Esto significa que un comprador puede señar tu propiedad para reservarla, dandote un determinado tiempo para buscar tu futura casa, y solo cuando formalices tu intención de compra, se realizan ambos negocios: la venta de tu casa, y la compra de tu futura casa. Recordá que te asesoramos en cada paso para evaluar alternativas como para que el proceso sea lo mas seguro posible.',
  },
  {
    question:
      'Si encuentro una propiedad que me gusta, ¿puedo hacer una reserva para que se la saquen del mercado mientras juntamos los papeles?',
    answer:
      'Sí, y la propiedad deja de ofrecerse o mostrarse a otros interesados. La reserva es un porcentaje del monto total que, al momento del cierre, se descuenta de lo que hay que abonar. Y de darse el caso que el negocio no prospere, esa reserva se devuelve completa, si se respetaron los plazos y términos acordados al momento de reservar.',
  },
  {
    question:
      '¿Cómo sé que el inmueble no tiene deudas ocultas, juicios o hipotecas que me traigan problemas después?',
    answer:
      'Tanto para el comprador como para el vendedor, en Damero nos ocupamos de revisar que ambas partes estén en conocimiento de todos los aspectos relacionados con deudas, juicios o hipotecas, y de resolver cada caso para que nadie deba hacerse cargo de futuros problemas sorpresivos.',
  },
  {
    question:
      'Quiero alquilar. ¿Qué requisitos exactos y garantías (garantes, recibos de sueldo) me van a pedir para alquilar?',
    answer:
      'Cualquier propietario necesita reunir certezas antes de hacer ingresar inquilinos a su propiedad. Es por ello que los interesados deben demostrar que poseen el grado de confianza necesaria entre sus contactos como para reunir garantías a las cuales el propietario puede recurrir para cubrirse ante posibles faltas de pago. Por ello como inmobiliaria solicitamos constancias de ingresos suficientes a los inquilinos, y 4 recibos de sueldo de contactos aptos cuyo monto sea al menos el triple de la mensualidad, pudiendo reemplazarse dos recibos de sueldo con una garantía propietaria. Esto es necesario y brinda certezas tanto al propietario como al inquilino para evitar cualquier problema durante los años del contrato.',
  },
  {
    question:
      'Quiero alquilar y quiero saber quién paga los gastos de mantenimiento extraordinarios o los arreglos estructurales si algo se rompe en el departamento',
    answer:
      'Mayormente el inquilino no está involucrado en los problemas estructurales de la propiedad (filtraciones, rajaduras, etc) por lo que los gastos de este tipo de averías corren por parte del propietario. Problemas devenidos del uso mismo de las instalaciones (cerraduras, vidrios, etc) los debe solventar el inquilino. Si la propiedad luego del alquiler la administramos nosotros, te indicamos en cada caso como resolver el problema.',
  },
  {
    question:
      '¿Cómo se calculan y cada cuánto tiempo se realizan los aumentos o actualizaciones del valor del alquiler?',
    answer:
      'En cuanto al tiempo, el valor del alquiler se actualiza según el período establecido en el contrato y el valor se calcula tomando el dato oficial del IPC (índice de precios al consumidor)',
  },
  {
    question:
      '¿Qué porcentaje de la renta mensual se queda la inmobiliaria en concepto de administración y qué tareas incluye ese servicio?',
    answer:
      'Si decidís que la inmobiliaria administre el alquiler de tu propiedad, ganas tranquilidad en cuestiones relacionadas a pagos de impuestos, arreglos, cálculo del monto mensual, y pones un intermediario que resguarda tu tiempo en la relación con el inquilino y con la administración del edificio, si es el caso. Este servicio es el 10% de la renta mensual.',
  },
  {
    question:
      '¿Por qué los precios de las propiedades varían tanto y de qué depende que suban o bajen en una zona específica?',
    answer:
      'Porque entran en juego muchos factores determinantes, y cada caso es distinto. En la locación de la propiedad se analiza su valor comercial, el acceso a servicios y distancia a centros de interés (educativos, comerciales, de salud, etc); el tamaño del lote y los metros cuadrados cubiertos; el estado de la propiedad, tanto lo visible como lo estructural, y servicios de agua, luz y calefacción; el valor según lo que la regulación permita construir; el estado de papeles y deudas que pueda arrastrar; el valor, altura y estado de propiedades linderas y negocios realizados en propiedades similares, entre otros factores.',
  },
  {
    question:
      '¿Qué es una "reserva" y qué pasa con ese dinero si la operación se cae por culpa de alguna de las partes?',
    answer:
      'La reserva es un monto (un 3% del valor negociado, generalmente) que da prioridad al interesado a negociar y bloquea la muestra y el ofrecimiento a otros interesados, hasta resolver el resultado, sea que se realice el negocio o no. Hay un tiempo coherente y acordado entre las partes para la tarea, y si la operación se cae, la reserva se devuelve. Es necesario saber que puede existir el caso donde alguna de las partes deba pagar una multa (devenida del valor de la reserva) si la operación se cae por factores que perjudiquen a alguno de los involucrados en el negocio, por ejemplo, que al momento de completar el pago, el comprador no tenga el dinero; o que el propietario luego de la reserva, no quiera vender por el precio pactado. En Damero te asesoramos para que cada paso sea resuelto con normalidad y se pueda evitar el gasto que perjudique a cualquiera de las partes.',
  },
];

/** Page head copy — verbatim from the validated screens. */
export const FAQ_PAGE = {
  eyebrow: 'PREGUNTAS FRECUENTES',
  title: 'Preguntas frecuentes',
  subhead:
    'Reunimos las consultas más habituales sobre publicar, comprar y alquilar con Damero. Si no encontrás tu respuesta, escribinos por WhatsApp.',
} as const;

/**
 * Side rail (desktop) / closing band (mobile) copy — verbatim from the
 * screens. §17.3:722-723: the page's single primary CTA lives here. The CTA
 * label itself comes from `WhatsAppCta`; the hours come from
 * `CONTACT_HOURS` in `site.ts` so every surface shows the same string.
 */
export const FAQ_CONTACT = {
  eyebrow: 'SEGUIMOS EN CONTACTO',
  heading: 'Si tu consulta no está acá, escribinos.',
  body: 'Te respondemos por WhatsApp en horario de atención.',
} as const;

/**
 * Full-width text link closing the desktop layout (the screens' bottom
 * hairline row; the mobile screen omits it, so it renders ≥ md only). The
 * literal `→` is the only arrow affordance §6 permits inside a text link.
 */
export const FAQ_MORE_LINK = {
  label: 'Ver todas las propiedades →',
  href: '/propiedades',
} as const;
