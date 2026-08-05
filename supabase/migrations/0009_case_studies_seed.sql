-- Seed de los 19 casos de éxito actuales, extraídos de sus páginas HTML
-- estáticas (casos-de-exito.html + caso-*.html) para que dejen de editarse
-- a mano y pasen a gestionarse desde /casos-admin. Las imágenes existentes
-- se referencian con su ruta local original (public/imgs/...) — no se han
-- re-subido a Storage; solo las imágenes nuevas o reemplazadas desde el
-- admin a partir de ahora generarán URLs de Supabase Storage.
-- Ejecutar DESPUÉS de 0008_case_studies.sql.

-- Conocido: el logo de Velites (imgs/velites_logo_letras_WHITE.avif) depende
-- del filtro CSS `invert` que tenía la página estática original para verse
-- sobre fondo blanco; ese filtro no se replica en la plantilla generada, así
-- que el logo quedará invisible en el hero hasta que se suba una versión
-- oscura desde /casos-admin. Mismo caso, más leve, en el avatar del
-- testimonio de TravelPerk (imgs/travel-logo-white.png): se verá mal sobre
-- el fondo blanco de la tarjeta hasta que se reemplace.

-- Nutfruit
insert into public.case_studies (id, slug, brand_name, sector, resultado, cover_image_url, cover_image_alt, logo_url, description, challenge_text, mid_image_url, mid_image_alt, solution_text, position, is_active) values (
  '6f188b21-0bf8-463c-a8f2-47e7f5507ac3', 'nutfruit', 'Nutfruit', 'Alimentación & Bebidas', 'Awareness',
  'imgs/nutfruit-portada.jpg', 'Caso de éxito NUTFRUIT - Transformación digital de marca de frutos secos', 'imgs/nutfruit-negro.png',
  'Nutfruit es una iniciativa del Consejo Internacional de Frutos Secos y Frutas Deshidratadas (INC) orientada a promover el consumo de alimentos de origen vegetal con alto valor nutricional. Su objetivo es fomentar hábitos de alimentación saludables y sostenibles a través de contenido educativo e inspiracional.',
  'Lanzar y posicionar una marca en múltiples mercados de Latinoamérica, logrando conectar con audiencias diversas en países como Brasil, Argentina, Chile y México.

principal desafío era construir una comunicación consistente a nivel regional, pero al mismo tiempo lo suficientemente local para generar cercanía, relevancia cultural y engagement real en cada país.',
  'imgs/nut-img1.jpg', 'Imagen representativa del caso Nutfruit',
  'La solución se basó en una estrategia de contenido integral que combinó consistencia regional con una fuerte adaptación local, posicionando a Nutfruit a través de contenido educativo y aspiracional vinculado a hábitos de consumo consciente.

Para lograr cercanía y relevancia en cada mercado, ajustamos la comunicación según el lenguaje y los códigos culturales de cada país, incorporando además creadores de contenido locales que permitieron humanizar la marca y conectar de forma más auténtica con la audiencia.

La ejecución se desarrolló de forma multiplataforma, con presencia activa en redes sociales, contenido global en YouTube y una estrategia de UGC y Pinterest, logrando así amplificar el alcance y consolidar una marca relevante en toda Latinoamérica.',
  1, true
);
insert into public.case_study_results (case_study_id, value, label, position) values ('6f188b21-0bf8-463c-a8f2-47e7f5507ac3', '+310M', 'de alcance total (2024 + 2025)', 1);
insert into public.case_study_results (case_study_id, value, label, position) values ('6f188b21-0bf8-463c-a8f2-47e7f5507ac3', '+2.7M', 'de interacciones (engagement total)', 2);
insert into public.case_study_results (case_study_id, value, label, position) values ('6f188b21-0bf8-463c-a8f2-47e7f5507ac3', '+325K', 'seguidores nuevos en el periodo', 3);

-- Velites
insert into public.case_studies (id, slug, brand_name, sector, resultado, cover_image_url, cover_image_alt, logo_url, description, challenge_text, mid_image_url, mid_image_alt, solution_text, position, is_active) values (
  'c1cee0f2-7c11-48ec-81b8-cd89879c85df', 'velites', 'Velites', 'Moda & Lifestyle', 'Ventas',
  'imgs/velites-portada.jpg', 'Caso de éxito VELITES - Equipamiento deportivo premium', 'imgs/velites_logo_letras_WHITE.avif',
  'Velites es una marca española de equipamiento deportivo premium enfocada en fitness funcional de alto rendimiento. Con una comunidad sólida en CrossFit y presencia en competiciones internacionales, la base estaba clara. El reto era convertir esa tracción en crecimiento real dentro del canal ecommerce.',
  'Escalar ventas online de forma rentable. No solo crecer. Hacerlo manteniendo eficiencia en múltiples mercados, con inversión creciente y sin perder control sobre CPA y ROAS. El objetivo era claro: más ventas, más clientes nuevos y un sistema capaz de sostener el crecimiento en el tiempo.',
  'imgs/handgrips.webp', 'Imagen representativa del caso Velites',
  'Se construyó un sistema de Paid Media completo, estructurado por fases de funnel: Visibilidad: captación de nueva audiencia Consideración: activación de intención Conversión: remarketing y cierre

Todo conectado bajo un mismo sistema de medición y optimización. Pero la clave no fue la estructura. Fue el enfoque.

Pasar de una gestión reactiva a un modelo predictivo: anticipar estacionalidades, testear de forma constante y tomar decisiones basadas en datos comparables en el tiempo.

Immoral no actuó como agencia. Actuó como partner.',
  2, true
);
insert into public.case_study_results (case_study_id, value, label, position) values ('c1cee0f2-7c11-48ec-81b8-cd89879c85df', '+400%', 'en facturación', 1);
insert into public.case_study_results (case_study_id, value, label, position) values ('c1cee0f2-7c11-48ec-81b8-cd89879c85df', '+370%', 'en volumen de compras', 2);
insert into public.case_study_results (case_study_id, value, label, position) values ('c1cee0f2-7c11-48ec-81b8-cd89879c85df', '+380%', 'en captación de nuevos clientes', 3);

-- AMLUL
insert into public.case_studies (id, slug, brand_name, sector, resultado, cover_image_url, cover_image_alt, logo_url, description, challenge_text, mid_image_url, mid_image_alt, solution_text, position, is_active) values (
  'e2ce8fe6-04e2-45c4-94b1-af66af1cdecc', 'amlul', 'AMLUL', 'Moda & Lifestyle', 'Ventas',
  'imgs/amlul-portada.jpg', 'Caso de éxito AMLUL - Transformación digital de marca de moda', 'imgs/amlul-logo.png',
  'Amlul, fundada por la renombrada influencer Gala González en 2019, no es sólo una marca de moda; es un compromiso. Amlul se ha posicionado como líder en moda responsable, producción ética y diseño atemporal. Su meta es clara: transformar el mundo de la moda con conciencia y elegancia.',
  'El desafío era doble: aumentar ventas y visibilidad online mientras se proyectaban los valores sostenibles de la marca, y expandir el alcance globalmente, llevando el mensaje de moda responsable a distintos rincones del mundo.',
  'imgs/port-amlul.webp', 'Imagen representativa del caso Amlul',
  'Lanzamos campañas de visibilidad de marca para presentar Amlul a nuevas audiencias, destacando sus valores de moda responsable y producción ética. Para ello, utilizamos las redes de display de Taboola y campañas de reconocimiento en Facebook e Instagram.

Paralelamente, creamos campañas de consideración en buscadores para captar tráfico de términos de búsqueda relacionados con la moda sostenible y atemporal.

También implementamos campañas de remarketing omnicanal para reimpactar a las personas interesadas en Amlul que no llegaron a realizar una compra después de visitar la web.

Finalmente, nos enfocamos en aumentar el valor de vida del cliente (LTV), para lo cual realizamos campañas de venta cruzada de diferentes colecciones de Amlul, utilizando email marketing y publicidad en redes sociales y display.',
  3, true
);
insert into public.case_study_results (case_study_id, value, label, position) values ('e2ce8fe6-04e2-45c4-94b1-af66af1cdecc', '+45%', 'Mejora del CAC', 1);
insert into public.case_study_results (case_study_id, value, label, position) values ('e2ce8fe6-04e2-45c4-94b1-af66af1cdecc', '+32%', 'Mejora del CLTV', 2);
insert into public.case_study_results (case_study_id, value, label, position) values ('e2ce8fe6-04e2-45c4-94b1-af66af1cdecc', '9', 'ROAS Medio', 3);

-- Bobo Choses
insert into public.case_studies (id, slug, brand_name, sector, resultado, cover_image_url, cover_image_alt, logo_url, description, challenge_text, mid_image_url, mid_image_alt, solution_text, position, is_active) values (
  '3d57a39c-0c79-43bc-9006-8e990ceb2658', 'bobo', 'Bobo Choses', 'Moda & Lifestyle', 'Ventas',
  'imgs/bobo-portada.jpg', 'Caso de éxito Bobo Choses - Ecommerce de moda infantil', 'imgs/bobo-logo.svg',
  'Bobo Choses es una marca internacional de moda conocida por su estilo vanguardista e innovador. En su esencia, busca vestir a niños y adultos con piezas que combinan comodidad y estética contemporánea, mientras cuentan una historia.',
  'Bobo Choses es una marca de ropa que vende en todo el mundo a través de tiendas multimarca físicas y online. La tienda online era una parte muy pequeña de la facturación de la empresa y el reto era hacerla crecer en el canal digital. Además, habían hecho campañas con otras agencias sin resultados por lo que venían un poco desilusionados y sin confianza en las campañas de paid media.',
  'imgs/bobo-img.webp', 'Imagen representativa del caso Bobo Choses',
  'Empezamos a trabajar juntos en 2018 y desde el principio no sólo tomamos un enfoque cross-channel, sino que abordamos cada nivel del proceso de compra del cliente.

Inicialmente, potenciamos y optimizamos campañas de visibilidad dirigidas a nuevas audiencias, garantizando que Bobo Choses fuera descubierto por potenciales clientes que aún no conocían la marca. Además, implementamos campañas de shopping, aprovechando el poder visual de sus productos y colocándolos directamente frente a clientes dispuestos a comprar. Paralelamente, lanzamos campañas en YouTube, maximizando el alcance y conectando emocionalmente con la audiencia a través de contenidos visuales atractivos.

Cada campaña se monitoreaba y optimizaba constantemente para asegurar el máximo rendimiento. Esto se tradujo en un retorno de inversión sin precedentes, potenciando la marca en el competitivo mercado digital.

Más tarde implementamos un CRM (Customer Relationship Manager) y definimos una estrategia de automatización con múltiples flujos y puntos de contacto, así como una CDP (Customer Data Platform) para poder empezar a explotar toda su first-party data al máximo nivel.',
  4, true
);
insert into public.case_study_results (case_study_id, value, label, position) values ('3d57a39c-0c79-43bc-9006-8e990ceb2658', '+65%', 'Usuarios', 1);
insert into public.case_study_results (case_study_id, value, label, position) values ('3d57a39c-0c79-43bc-9006-8e990ceb2658', '+102%', 'Pedidos', 2);
insert into public.case_study_results (case_study_id, value, label, position) values ('3d57a39c-0c79-43bc-9006-8e990ceb2658', '8', 'ROAS Medio', 3);
insert into public.case_study_testimonials (case_study_id, highlight, quote, author_name, author_role, position) values ('3d57a39c-0c79-43bc-9006-8e990ceb2658', 'Compromiso, proactividad y resolución', 'Su continua aportación, sus conocimientos, su experiencia y sus ganas por hacer que la marca crezca les han convertido en partners fundamentales para el crecimiento de negocio online, la estrategia de marketing digital y nuestra inversión en medios publicitarios.', 'AINARA SIMÓN', 'Chief Digital Manager, Bobo Choses', 1);
insert into public.case_study_testimonials (case_study_id, highlight, quote, author_name, author_role, position) values ('3d57a39c-0c79-43bc-9006-8e990ceb2658', 'Agilidad, inteligencia y feedback', 'Tres aspectos muy destacables de su trabajo, fundamentales para confiar nuestra estrategia de paid media a este equipo.', 'TONI TIÓ', 'Chief Communications Manager, Bobo Choses', 2);

-- La Manso
insert into public.case_studies (id, slug, brand_name, sector, resultado, cover_image_url, cover_image_alt, logo_url, description, challenge_text, mid_image_url, mid_image_alt, solution_text, position, is_active) values (
  '90c1cd91-c401-4c2d-80ed-d5ba0c03e630', 'lamanso', 'La Manso', 'Moda & Lifestyle', 'Ventas',
  'imgs/lamanso-portada.jpg', 'Caso de éxito La Manso - Joyería de diseñador', 'imgs/manso-logo.png',
  'La Manso es una distinguida marca de joyería de diseñador con base en Barcelona, aclamada por sus piezas hechas a mano y de carácter icónico. No es simplemente una marca, sino una narrativa que captura la dualidad entre lo cotidiano y lo extraordinario, encapsulando momentos significativos y anécdotas para inmortalizarlas.',
  'La Manso tenía como desafío llegar a un público global que resuene con su ethos, incrementando no solo su visibilidad, sino también sus ventas online. El objetivo era claro: potenciar la marca y maximizar las conversiones de su tienda online.',
  'imgs/port-manso.webp', 'Imagen representativa del caso La Manso',
  'Nos enfocamos en una estrategia full funnel basada en nuestra metodología "Brandformance". Comenzamos con campañas en Meta dirigidas a diferentes audiencias para amplificar la visibilidad de La Manso.

Mediante experimentación con variadas audiencias, creatividades y geografías, extrajimos insights esenciales que sentaron las bases para escalar nuestro enfoque. En paralelo, desarrollamos campañas en Google, asegurando que La Manso mantuviera una presencia dominante en los resultados de búsqueda y shopping.

Con una etapa inicial de aprendizaje superada, optimizamos las campañas para no solo impulsar la visibilidad, sino también garantizar la rentabilidad. A través de esta estrategia dual, pudimos fomentar un crecimiento sustancial en las ventas, manteniendo al mismo tiempo la esencia y autenticidad de La Manso.',
  5, true
);
insert into public.case_study_results (case_study_id, value, label, position) values ('90c1cd91-c401-4c2d-80ed-d5ba0c03e630', '-449%', 'Mejora del CAC', 1);
insert into public.case_study_results (case_study_id, value, label, position) values ('90c1cd91-c401-4c2d-80ed-d5ba0c03e630', '+523%', 'Mejora del ROAS', 2);
insert into public.case_study_results (case_study_id, value, label, position) values ('90c1cd91-c401-4c2d-80ed-d5ba0c03e630', '+16%', 'Mejora de la tasa de conversión', 3);

-- La Marca Well
insert into public.case_studies (id, slug, brand_name, sector, resultado, cover_image_url, cover_image_alt, logo_url, description, challenge_text, mid_image_url, mid_image_alt, solution_text, position, is_active) values (
  '4d40ee8d-afa5-43e6-bf2f-1bf73ab81777', 'marcawell', 'La Marca Well', 'Salud & Bienestar', 'Ventas',
  'imgs/marcawell-portada.jpg', 'Caso de éxito La Marca Well - Centro de bienestar', 'imgs/well-logo.png',
  'La Marca Well es la concreción de una visión compartida por las hermanas Mischka y Magally Capriles. Desde su fundación en 2017, se ha consolidado como un referente en promoción de bienestar y conciencia ambiental, ofreciendo una variedad de productos y servicios enfocados en nutrir cuerpo y alma. Con un centro wellness en Madrid que incluye tienda, restaurante y gimnasio, es una marca comprometida con mejorar la calidad de vida de sus clientes.',
  'El dualismo de LaMarca Well presentaba un desafío único: maximizar la visibilidad de la marca en el ámbito digital mientras se enfoca en atraer a una audiencia más amplia, amante del bienestar. El propósito era claro: promover un bienestar holístico a través de los cuatro pilares EAT, HEAL, MOVE y SEEK.',
  'imgs/port-well3.webp', 'Imagen representativa del caso La Marca Well',
  'Para introducir a LaMarca Well a una audiencia más amplia, iniciamos campañas de reconocimiento enfatizando sus valores tanto en contenido editorial como en productos de bienestar.

Complementando esto, aprovechamos la popularidad de YouTube en España para dirigir campañas de reconocimiento, buscando conectar con aquellos apasionados por un estilo de vida saludable.

Paralelamente, introdujimos campañas de consideración y conversión para LaMarca Shop. Para fomentar la retención y mantener a LaMarca Well en la mente de los clientes, implementamos campañas de remarketing a través de email marketing. Estas estrategias se diseñaron específicamente para reconectar con aquellos que mostraron interés inicial pero no completaron una compra.',
  6, true
);
insert into public.case_study_results (case_study_id, value, label, position) values ('4d40ee8d-afa5-43e6-bf2f-1bf73ab81777', '-357%', 'Mejora del CAC', 1);
insert into public.case_study_results (case_study_id, value, label, position) values ('4d40ee8d-afa5-43e6-bf2f-1bf73ab81777', '+200%', 'Aumento del ROAS', 2);

-- Ángela Navarro
insert into public.case_studies (id, slug, brand_name, sector, resultado, cover_image_url, cover_image_alt, logo_url, description, challenge_text, mid_image_url, mid_image_alt, solution_text, position, is_active) values (
  '56dcfdd8-9690-4325-b597-e5aaa673d940', 'angelanavarro', 'Ángela Navarro', 'Salud & Bienestar', 'Leads',
  'imgs/angela2.webp', 'Caso de éxito Ángela Navarro - Belleza oncológica', 'imgs/angela-logo-dark.png',
  'Ángela Navarro ha emergido como un pilar en el sector de la belleza oncológica, ofreciendo soluciones estéticas adaptadas. Con una variedad que incluye desde pelucas de alta calidad hasta la exclusiva línea de cosméticos ADAPTA, se dedican con pasión a mantener la belleza y el bienestar en los momentos más retadores.',
  'Pese a la calidad y el valor añadido de sus productos y servicios, el reto estaba en impulsar simultáneamente el interés por las pelucas y potenciar las ventas de su línea ADAPTA. Necesitábamos maximizar tanto la visibilidad como la conversión en estas dos áreas del negocio.',
  'imgs/angela.webp', 'Imagen representativa del caso Ángela Navarro',
  'Empezamos a colaborar a principios de 2021. Para abordar este complejo desafío, diseñamos una estrategia integral, enfocándonos en cada nivel del embudo de marketing. Iniciamos con campañas de visibilidad, presentando la exclusiva propuesta de valor de Ángela Navarro a nuevas audiencias. Introducimos campañas en buscadores, centradas en términos específicos ligados a la belleza oncológica y pelucas.

Apostamos por campañas de remarketing que no solo retomaban el interés inicial de los usuarios, sino que también se esforzaban en resaltar el potencial a largo plazo de la línea cosmética ADAPTA. Con el tiempo, el equipo ha ido creciendo y el proyecto sigue escalando!',
  7, true
);
insert into public.case_study_results (case_study_id, value, label, position) values ('56dcfdd8-9690-4325-b597-e5aaa673d940', '+105%', 'Usuarios', 1);
insert into public.case_study_results (case_study_id, value, label, position) values ('56dcfdd8-9690-4325-b597-e5aaa673d940', '+60%', 'LEADS', 2);
insert into public.case_study_results (case_study_id, value, label, position) values ('56dcfdd8-9690-4325-b597-e5aaa673d940', '+87%', 'Facturación bruta', 3);
insert into public.case_study_testimonials (case_study_id, highlight, quote, author_name, author_role, position) values ('56dcfdd8-9690-4325-b597-e5aaa673d940', 'Es como tener al equipo dentro de casa', 'Son súper proactivos, están siempre detrás ofreciendo soluciones.', 'BEA GUERRERO', 'Directora , Angela Navarro', 1);
insert into public.case_study_testimonials (case_study_id, highlight, quote, author_name, author_role, position) values ('56dcfdd8-9690-4325-b597-e5aaa673d940', 'Son un complemento perfecto', 'Están totalmente integrados en el desarrollo de todos nuestros proyectos. Muchas gracias!', 'MER GIL', 'Directora de Comunicación, Angela Navarro', 2);

-- Cool Bottles
insert into public.case_studies (id, slug, brand_name, sector, resultado, cover_image_url, cover_image_alt, logo_url, description, challenge_text, mid_image_url, mid_image_alt, solution_text, position, is_active) values (
  'ad3d500f-48c0-44e4-a57b-ffaeb8c38d73', 'coolbottles', 'Cool Bottles', 'Moda & Lifestyle', 'Ventas',
  'imgs/cool-portada.jpg', 'Caso de éxito Cool Bottles - Ecommerce de producto', 'imgs/cool-logo-dark.avif',
  'Cool Bottles no es simplemente una empresa de botellas reutilizables; es una marca que combina elegancia y sofisticación con innovación puntera, enfocándose en ofrecer una experiencia excepcional. Su misión trasciende el producto: es una llamada a un mundo más sostenible y consciente.',
  'El mercado digital está saturado de propuestas y soluciones para una vida sostenible. El reto fue resaltar la singularidad de CoolBottles en un espacio tan competitivo, aumentando su presencia digital y convirtiendo visitas en ventas tangibles en su tienda online.',
  'imgs/cool.webp', 'Imagen representativa del caso Cool Bottles',
  'Para acercar a Cool Bottles a su público objetivo, diseñamos una estrategia Full Funnel para sus productos estrella. En la etapa TOFU, establecimos un primer contacto con audiencias estratégicas en la plataforma Meta, ofreciendo una presentación genuina y educativa sobre la marca.

Con una transición armoniosa al MOFU, nos centramos en los interesados que mostraron interés previo. Mediante campañas en Google Search, Shopping y Performance Max, destacamos la calidad y singularidad de los productos Cool Bottles.

En el BOFU, nos dirigimos a aquellos que ya conocían la marca, pero aún no se habían decidido. Con un tono minimalista y emotivo, subrayamos las ventajas de Cool Bottles frente a otras opciones en el mercado, resaltando la experiencia superior que ofrecen.',
  8, true
);
insert into public.case_study_results (case_study_id, value, label, position) values ('ad3d500f-48c0-44e4-a57b-ffaeb8c38d73', '+45%', 'Mejora del ROAS', 1);
insert into public.case_study_results (case_study_id, value, label, position) values ('ad3d500f-48c0-44e4-a57b-ffaeb8c38d73', '-121%', 'Bajada del CAC', 2);
insert into public.case_study_results (case_study_id, value, label, position) values ('ad3d500f-48c0-44e4-a57b-ffaeb8c38d73', '+418%', 'Mejora del CR', 3);
insert into public.case_study_testimonials (case_study_id, highlight, quote, author_name, author_role, position) values ('ad3d500f-48c0-44e4-a57b-ffaeb8c38d73', 'satisfechos con el trabajo del equipo', 'pesar de los retos iniciales, ahora todo está comenzando a encajar perfectamente. La colaboración está resultando cada vez más creativa, exigente y profesional. Especialmente valoramos la dedicación y conocimiento del equipo; Han demostrado un control y entendimiento excepcionales de nuestra cuenta, respondiendo de manera inmediata a nuestras necesidades y aportando un valor significativo. Creemos firmemente que, con su apoyo, estamos en el camino correcto para hacer nuestro negocio online rentable y sostenible.', 'Dani Ortiz', 'CoFounder & CEO, The Cool Bottles', 1);

-- Gabriel for Sach
insert into public.case_studies (id, slug, brand_name, sector, resultado, cover_image_url, cover_image_alt, logo_url, description, challenge_text, mid_image_url, mid_image_alt, solution_text, position, is_active) values (
  'c38aa671-58dd-4b18-9f41-27ec681dfbfd', 'gabrielforsach', 'Gabriel for Sach', 'Moda & Lifestyle', 'Ventas',
  'imgs/gabrielforsach-portada.jpg', 'Caso de éxito Gabriel for Sach - Bolsos de diseño', 'imgs/gabriel-logo-dark.png',
  'Gabriel for Sach es una firma con sede en Barcelona, especializada en la confección de bolsos de diseño de alta gama. Su legado se cimienta en la calidad inigualable y en una constante apuesta por la innovación en diseño.',
  'A pesar de ser un nombre reconocido en su mercado local, Gabriel for Sach tenía la ambición de cruzar fronteras y consolidarse en mercados internacionales. El desafío era claro: ganar visibilidad global, enfrentarse a gigantes de la moda internacional y solidificar su presencia digital.',
  'imgs/gabriel.webp', 'Imagen representativa del caso Gabriel for Sach',
  'Iniciamos a principios de 2021 con una estrategia full funnel, diseñada meticulosamente para posicionar a Gabriel for Sach en el radar de audiencias clave en regiones como Europa, EE.UU. y Corea del Sur. Esta iniciativa no solo se enfocó en generar visibilidad, sino que, mediante campañas de búsqueda específicas de la marca, contrarrestamos a competidores y captamos la atención derivada de nuestra campaña de sensibilización.

Con la relación ya establecida, empleamos tácticas de remarketing para cultivar y reforzar la conexión con estos potenciales clientes, ampliando el Valor de Vida del Cliente (LTV). Además, después de un examen profundo de la experiencia web de Gabriel for Sach, proponemos refinamientos para mejorar la tasa de conversión, garantizando una experiencia de usuario impecable y un proceso de compra intuitivo.',
  9, true
);
insert into public.case_study_results (case_study_id, value, label, position) values ('c38aa671-58dd-4b18-9f41-27ec681dfbfd', '+237%', 'Usuarios', 1);
insert into public.case_study_results (case_study_id, value, label, position) values ('c38aa671-58dd-4b18-9f41-27ec681dfbfd', '+234%', 'Pedidos', 2);
insert into public.case_study_results (case_study_id, value, label, position) values ('c38aa671-58dd-4b18-9f41-27ec681dfbfd', '2021', 'Desde 2021 trabajando juntos', 3);
insert into public.case_study_testimonials (case_study_id, highlight, quote, author_name, author_role, position) values ('c38aa671-58dd-4b18-9f41-27ec681dfbfd', 'Excepcionales, siempre disponibles, proactivos', 'Comprometidos en potenciar nuestras ventas. Siento que están profundamente involucrados en el proyecto, esforzándose diariamente para mejorar todo. Hemos escalado significativamente en marketing digital, y nuestra publicidad genera impacto. A pesar de los desafíos del sector, valoro enormemente su trabajo e implicación, y confío en que nuestra presencia digital seguirá creciendo gracias a sus acciones. ¡Es una gran suerte contar con ellos!', 'Mariona Mora', 'Gabriel For Sach', 1);

-- Grupo Mimara
insert into public.case_studies (id, slug, brand_name, sector, resultado, cover_image_url, cover_image_alt, logo_url, description, challenge_text, mid_image_url, mid_image_alt, solution_text, position, is_active) values (
  '88f3dd9b-26d3-489d-a630-edf252ba4697', 'grupomimara', 'Grupo Mimara', 'Salud & Bienestar', 'Leads',
  'imgs/mimara-portada.jpg', 'Caso de éxito Grupo Mimara - Residencias para mayores', 'imgs/manso-logo.png',
  'Mimara es una prestigiosa red de residencias y centros de día para adultos mayores en España. Su misión primordial es enriquecer la calidad de vida de cada residente, adaptando meticulosamente cada servicio a las necesidades individuales.',
  'La meta de Mimara era clara pero compleja: potenciar la captación de clientes potenciales para sus centros ubicados en localidades específicas como Oviedo, Tarragona, Asturias y Soria.',
  'imgs/mimara.webp', 'Imagen representativa del caso Grupo Mimara',
  'En la fase superior del embudo, trabajamos con precisión en la segmentación del público objetivo, identificando las particularidades entre los adultos mayores y sus hijos. Cada segmento recibió un mensaje personalizado, diseñado para resonar profundamente con sus necesidades y emociones.

La fase media del embudo se orientó hacia campañas de Product Search en Google. Esta táctica se diseñó para transformar el interés inicial en acciones más concretas, incentivando a los posibles clientes a tomar decisiones informadas para el bienestar de sus seres queridos.

Finalmente, en la fase más baja del embudo, implementamos una estrategia de remarketing robusta. Utilizando anuncios personalizados, recordamos a aquellos interesados las ventajas y valores de Mimara, motivándolos a dar el paso final y convertirse en clientes. Esta fase fue esencial para reforzar el reconocimiento de marca y fomentar la conversión directa.',
  10, true
);
insert into public.case_study_results (case_study_id, value, label, position) values ('88f3dd9b-26d3-489d-a630-edf252ba4697', '+98%', 'Aumento de contactos', 1);
insert into public.case_study_results (case_study_id, value, label, position) values ('88f3dd9b-26d3-489d-a630-edf252ba4697', '-127%', 'Bajada del CPL', 2);

-- iVentions
insert into public.case_studies (id, slug, brand_name, sector, resultado, cover_image_url, cover_image_alt, logo_url, description, challenge_text, mid_image_url, mid_image_alt, solution_text, position, is_active) values (
  'e57aa1f9-7628-4d87-aec3-4a2ae003cae3', 'iventions', 'iVentions', 'Servicios B2B & SaaS', 'Leads',
  'imgs/iventions-portada.jpg', 'Caso de éxito iVentions - Stands para ferias', 'imgs/iventions-logo.svg',
  'Iventions es una empresa líder en el diseño y preparación de stands para ferias y congresos. Con una cartera de clientes que incluye grandes nombres como Adidas, UEFA y LG, su trabajo destaca por su impecable atención al detalle, potenciando la imagen de marca y ofreciendo diseños y servicios de la más alta calidad. Su enfoque B2B en un sector específico hace que cada conversión sea de un valor excepcionalmente alto.',
  'Iventions llegó a nosotros con un doble desafío: reducir los costes por conversión, mientras simultáneamente aumentaban la calidad y el número de sus contactos. Entendiendo la naturaleza especializada de su negocio, sabíamos que este reto requeriría una solución personalizada.',
  'imgs/iventions.webp', 'Imagen representativa del caso iVentions',
  'Primero, realizamos un profundo análisis de los objetivos de negocio de Iventions y definimos su mercado objetivo en Internet. Posteriormente, llevamos a cabo una meticulosa auditoría de PPC de sus campañas previas. Esta revisión nos permitió identificar las áreas donde se estaban perdiendo recursos y ajustar las campañas para mejorar la eficiencia.

Con una base sólida establecida, lanzamos tests A/B y trazamos una estrategia de optimización. Esto nos permitió ampliar las campañas a los principales mercados objetivo de Iventions, asegurando una captación de clientes internacionales más efectiva y eficiente.',
  11, true
);
insert into public.case_study_results (case_study_id, value, label, position) values ('e57aa1f9-7628-4d87-aec3-4a2ae003cae3', '+80%', 'Aumento de Leads', 1);
insert into public.case_study_results (case_study_id, value, label, position) values ('e57aa1f9-7628-4d87-aec3-4a2ae003cae3', '-345%', 'Bajada de CPL', 2);

-- Mun Kombucha
insert into public.case_studies (id, slug, brand_name, sector, resultado, cover_image_url, cover_image_alt, logo_url, description, challenge_text, mid_image_url, mid_image_alt, solution_text, position, is_active) values (
  'a5da77eb-86f2-4fd4-b5eb-742127a2410a', 'munkombucha', 'Mun Kombucha', 'Alimentación & Bebidas', 'Ventas',
  'imgs/munkombucha-portada.jpg', 'Caso de éxito Mun Kombucha - Ecommerce de bebidas', 'imgs/mun-logo.png',
  'Mun Kombucha fusiona salud, sabor y sostenibilidad en sus bebidas. Comprometida con la calidad e innovación, refleja un estilo de vida consciente y saludable. Sus productos, creados con ingredientes naturales y métodos artesanales, deleitan y aportan beneficios probióticos y nutricionales.',
  'En un mundo donde la salud y el bienestar cobran cada vez más importancia, Mun Kombucha buscaba expandir su impacto en el mercado español de bebidas saludables. Su ambición era clara: incrementar significativamente su presencia y ventas en el ecommerce, adaptándose a las dinámicas de un mercado digital en constante evolución.',
  'imgs/mun.webp', 'Imagen representativa del caso Mun Kombucha',
  'Nuestra estrategia se centró en una serie de iniciativas integradas que abarcaron desde campañas publicitarias hasta mejoras en el sitio web.

Empezamos por diseñar y lanzar campañas publicitarias en plataformas clave como Meta, Google Shopping, Search, Display y YouTube. Cada una de estas campañas fue cuidadosamente elaborada para resonar con la audiencia de Mun Kombucha, destacando los valores y la calidad de sus productos.

Paralelamente, nos enfocamos en optimizar la experiencia del usuario en su web. Mejoras en la interfaz y la navegabilidad no solo facilitaron la exploración y el proceso de compra para los usuarios, sino que también reflejaron la esencia moderna y saludable de la marca Mun Kombucha.',
  12, true
);
insert into public.case_study_results (case_study_id, value, label, position) values ('a5da77eb-86f2-4fd4-b5eb-742127a2410a', '+51%', 'Facturación', 1);
insert into public.case_study_results (case_study_id, value, label, position) values ('a5da77eb-86f2-4fd4-b5eb-742127a2410a', '+129%', 'Nuevos clientes', 2);
insert into public.case_study_results (case_study_id, value, label, position) values ('a5da77eb-86f2-4fd4-b5eb-742127a2410a', '+19%', 'Recurrencia', 3);
insert into public.case_study_testimonials (case_study_id, highlight, quote, author_name, author_role, position) values ('a5da77eb-86f2-4fd4-b5eb-742127a2410a', 'Descubrimos Immoral gracias a una recomendación', 'Lo que realmente nos impresionó fue su enfoque en nuestro potencial de crecimiento más que en sus honorarios.Cuentan con un equipo especializado y bien coordinado, ofreciendo un servicio excepcional y orientado a resultados, totalmente alineado con nuestros objetivos. Es una experiencia que sin duda recomendaría.', 'Jordi Dalmau', 'CEO, Mun Kombucha', 1);

-- Oxperta Capital
insert into public.case_studies (id, slug, brand_name, sector, resultado, cover_image_url, cover_image_alt, logo_url, description, challenge_text, mid_image_url, mid_image_alt, solution_text, position, is_active) values (
  'ecfd085e-3890-46e6-9dc8-2ea02f4a0c33', 'oxpertacapital', 'Oxperta Capital', 'Servicios B2B & SaaS', 'Leads',
  'imgs/oxpertacapital-portada.jpg', 'Caso de éxito Oxperta Capital - Servicios financieros', 'imgs/Oxperta-logo-dark.png',
  'Oxperta Capital es una empresa consolidada en el ámbito financiero, que ofrece soluciones especializadas tanto a individuos como a empresas. Con un enfoque centrado en Hipotecas, Reunificación de Deudas y Préstamos Personales, se esfuerzan por proporcionar respuestas económicas ajustadas a las necesidades de sus clientes.',
  'El principal desafío con Oxperta Capital era doble: aumentar su base de clientes potenciales en áreas clave y garantizar la máxima calidad de cada uno de esos leads, buscando un equilibrio perfecto entre coste y valor.',
  'imgs/oexpress.webp', 'Imagen representativa del caso Oxperta Capital',
  'A mediados de 2021, nuestra primera intervención fue un estudio del mercado, identificando segmentos precisos para maximizar la eficacia. Con esta información, desplegamos una estrategia bifronte: empleamos las plataformas de Facebook e Instagram para capturar leads y simultáneamente potenciamos las búsquedas online con Google Ads. Esta dualidad garantizó la máxima exposición y conectividad con los potenciales clientes en momentos cruciales de su proceso de decisión.

El segundo paso fue la implementación de Zapier, que permitió que cada lead generado se canalizara instantáneamente hacia los asesores comerciales de Oxperta. Esta inmediatez resultó vital para la optimización del tiempo de respuesta. Para reforzar y mantener el interés de estos leads, se introdujo una estrategia de email marketing, manteniendo a los potenciales clientes informados y conectados, facilitando así el proceso de conversión.',
  13, true
);
insert into public.case_study_results (case_study_id, value, label, position) values ('ecfd085e-3890-46e6-9dc8-2ea02f4a0c33', '165%', 'Leads', 1);
insert into public.case_study_results (case_study_id, value, label, position) values ('ecfd085e-3890-46e6-9dc8-2ea02f4a0c33', '-65%', 'Coste por Lead', 2);
insert into public.case_study_results (case_study_id, value, label, position) values ('ecfd085e-3890-46e6-9dc8-2ea02f4a0c33', '+67%', 'Calidad del lead (MQL)', 3);
insert into public.case_study_testimonials (case_study_id, highlight, quote, author_name, author_role, position) values ('ecfd085e-3890-46e6-9dc8-2ea02f4a0c33', 'agradecidos de tener como partner', 'Empezamos en mayo del 2021 y nos encontramos con un equipo super profesional, con personas con una gran capacidad de adaptación y atención que generó mucha confianza para incrementar las inversiones, porque se empezaban a obtener resultados. Creo que con ADMK, hubo un antes y después en Opción Capital y os convierte en partner que, ojalá, nos acompañe muchos años más y que evolucione junto a nosotros.', 'Guillermo Marcos', 'Director de Marketing, Oxperta Capital', 1);

-- Oxperta Express
insert into public.case_studies (id, slug, brand_name, sector, resultado, cover_image_url, cover_image_alt, logo_url, description, challenge_text, mid_image_url, mid_image_alt, solution_text, position, is_active) values (
  'ac1614e1-3c5f-4eb0-95e8-70a7c637477f', 'oxpertaexpress', 'Oxperta Express', 'Servicios B2B & SaaS', 'Leads',
  'imgs/oxpertaexpress-portada.jpg', 'Caso de éxito Oxperta Express - Servicios financieros', 'imgs/oxperta-logo.svg',
  'Oxperta Express es una firma líder en el sector de mensajería y logística. Su enfoque se centra en proveer soluciones de alta calidad tanto a empresas como a individuos, con un énfasis especial en las necesidades del sector ecommerce.',
  'La empresa deseaba ampliar su base de clientes potenciales en la unidad de ecommerce y expandir su presencia a regiones adicionales. El desafío residía en posicionar eficazmente a Oxperta Express en un mercado altamente competitivo.',
  'imgs/oexpress2.webp', 'Imagen representativa del caso Oxperta Express',
  'Nuestra Primera Etapa fue centrarnos en el branding. Diseñamos una estrategia que no solo destacara a Oxperta Express, sino que la posicionara en la mente de nuestro público objetivo: empresas que buscan soluciones logísticas fiables para su negocio ecommerce.

En la Segunda Etapa, implementamos una estrategia de performance, dirigida específicamente a un target B2B. Mediante el uso de plataformas como LinkedIn, Meta y Google Search, pusimos a Oxperta Express al frente y en el centro de las decisiones de aquellos que realmente importan.

Gracias a nuestra metodología de trabajo y a una comunicación constante, logramos aumentar significativamente el número de clientes potenciales, dando a Oxperta Express la visibilidad y el posicionamiento que se merece.',
  14, true
);
insert into public.case_study_results (case_study_id, value, label, position) values ('ac1614e1-3c5f-4eb0-95e8-70a7c637477f', '-147%', 'Mejora del CPL', 1);
insert into public.case_study_results (case_study_id, value, label, position) values ('ac1614e1-3c5f-4eb0-95e8-70a7c637477f', '+58%', 'Calidad del lead (MQL)', 2);
insert into public.case_study_testimonials (case_study_id, highlight, quote, author_name, author_role, position) values ('ac1614e1-3c5f-4eb0-95e8-70a7c637477f', 'valor y dedicación', 'Enhorabuena por esta nueva identidad. Seguro que os ayuda a transformar los grandes servicios de ADMK en experiencias memorables. Os desearía mucha suerte en esta nueva etapa, pero no creo que la necesitéis. Seguid aportando el mismo valor y dedicación a vuestros clientes como hasta ahora, que el éxito está asegurado. Con muchas ganas de seguir con los próximos retos y continuar creciendo junto a vosotros.', 'Manu Hens', 'Marketing y Comunicación, Oxperta Express', 1);

-- Teamder
insert into public.case_studies (id, slug, brand_name, sector, resultado, cover_image_url, cover_image_alt, logo_url, description, challenge_text, mid_image_url, mid_image_alt, solution_text, position, is_active) values (
  '1491f2c7-17d6-4feb-89eb-cc64f1c079e2', 'teamder', 'Teamder', 'Servicios B2B & SaaS', 'Leads',
  'imgs/teamder-portada.jpg', 'Caso de éxito Teamder - Automatización de captación', 'imgs/Imagotipo-Vertical-Blanco_1.png',
  'Teamder tiene la misión de revolucionar la forma en que las personas se relacionan en el trabajo. Con tecnología punta, quiere ayudarte a saber si tu nuevo compañero es el partner que siempre soñaste.',
  'Teamder nació como un proyecto interno desarrollado en Immoral Lab, nuestro espacio dedicado a la experimentación y creación de soluciones innovadoras. El reto estaba claro:',
  'imgs/teamder.webp', 'Imagen representativa del caso Teamder',
  'Este proyecto no iba solo de tecnología, iba de personas. Cada reto lo abordamos con una estrategia precisa, mezclando creatividad y resultados, porque sabíamos que Teamder merecía brillar.

1. Automatización impecable Con herramientas como Zapier y ActiveCampaign, construimos un sistema que hace que todo fluya: Formularios conectados a APIs inteligentes: Calculan cartas natales y compatibilidades basadas en IA en tiempo real. Respuestas instantáneas: Cada usuario recibe su análisis en segundos, asegurando una experiencia ágil y profesional. Flujo 24/7: Mientras el equipo descansa, las automatizaciones trabajan sin parar.

2. Una marca que no pasa desapercibida Creamos una identidad visual que refleja la esencia de Teamder: moderna, memorable y disruptiva. Inspirados en tendencias como el neobrutalismo y el glassmorfismo, diseñamos cada detalle con propósito: Isotipo y logotipo: Mezcla de solidez, colaboración e igualdad, con un toque de astrología que conecta emocionalmente. Estilo visual rompedor: Colores, formas y fuentes que no solo destacan, sino que cuentan una historia.

3. Comunicación que engancha y convierte Redefinimos el tono comunicativo de Teamder, asegurándonos de hablar de tú a tú con su audiencia. Nada de formalismos; todo directo, cercano y efectivo. Mensajes como: "¿Es tu nuevo colega el partner in work que necesitas? Descúbrelo con Teamder." lograron captar la atención y guiar a los usuarios a la acción. Diseñamos y ejecutamos una secuencia de emails optimizada, aumentando la conversión en cada etapa del funnel.

4. Más ojos sobre la marca Landing Pages que convierten: Creamos páginas que no solo eran bonitas, sino funcionales, probando cada elemento con A/B testing. UGC que impacta: Producimos videos auténticos de usuarios contando cómo Teamder transformó sus relaciones laborales. Redes Sociales a tope: Diseñamos estrategias para Instagram, TikTok y LinkedIn, asegurándonos de que cada publicación conectara con el público correcto.',
  15, true
);
insert into public.case_study_results (case_study_id, value, label, position) values ('1491f2c7-17d6-4feb-89eb-cc64f1c079e2', '17', 'Automatizaciones', 1);
insert into public.case_study_results (case_study_id, value, label, position) values ('1491f2c7-17d6-4feb-89eb-cc64f1c079e2', '4', 'Landing Pages en Test A/B', 2);
insert into public.case_study_results (case_study_id, value, label, position) values ('1491f2c7-17d6-4feb-89eb-cc64f1c079e2', '6', 'Semanas de proyecto', 3);

-- Crewel Work
insert into public.case_studies (id, slug, brand_name, sector, resultado, cover_image_url, cover_image_alt, logo_url, description, challenge_text, mid_image_url, mid_image_alt, solution_text, position, is_active) values (
  '3c420abb-a2dc-441e-845a-21698dc27005', 'thecrewel', 'Crewel Work', 'Moda & Lifestyle', 'Ventas',
  'imgs/crewel-portada.jpg', 'Caso de éxito The Crewel Work Company - Kits de bordado', 'imgs/crewel-logo-white.png',
  'Crewel Work, líder en el Reino Unido, combina arte y tradición con sus exclusivos kits de bordados isabelinos. Pero no solo venden kits, también ofrecen retiros de bordados, conectando pasión y tradición en experiencias únicas.',
  'En un mundo que se inclina rápidamente hacia lo digital, Crewel Work buscaba ampliar su alcance global y aumentar las ventas de sus kits. ¿El desafío? Priorizar los productos físicos, sin dejar de lado la esencia y valor de sus retiros.',
  'imgs/crewel.webp', 'Imagen representativa del caso Crewel Work',
  'Empezamos a trabajar juntos a principios de 2020. Primero, nos adentramos en el corazón de Crewel Work para entender su esencia. Creamos campañas dirigidas que aumentaran su visibilidad y las presentaran a audiencias frescas y relevantes. Sin perder el enfoque, intensificamos la consideración del cliente utilizando tácticas de buscadores y estrategias de shopping, garantizando que Crewel Work estuviera en la mente de los consumidores al tomar decisiones. Además, reconociendo la importancia de la lealtad del cliente, implementamos estrategias de remarketing para maximizar el valor a largo plazo de cada comprador.

Pero no nos detuvimos ahí. Sabíamos que una experiencia online fluida era esencial. Así que buceamos en la usabilidad de su sitio web. Después de un análisis meticuloso, propusimos mejoras centradas en el usuario e implementamos un CRM para garantizar que, una vez que los visitantes llegaran, se quedaran y se convirtieran en leales clientes.',
  16, true
);
insert into public.case_study_results (case_study_id, value, label, position) values ('3c420abb-a2dc-441e-845a-21698dc27005', '+234%', 'Incremento de pedidos', 1);
insert into public.case_study_results (case_study_id, value, label, position) values ('3c420abb-a2dc-441e-845a-21698dc27005', '+167%', 'Incremento de ingresos', 2);

-- TravelPerk
insert into public.case_studies (id, slug, brand_name, sector, resultado, cover_image_url, cover_image_alt, logo_url, description, challenge_text, mid_image_url, mid_image_alt, solution_text, position, is_active) values (
  'ff22ba45-5c51-421a-81d0-d629729b282b', 'travelperk', 'TravelPerk', 'Servicios B2B & SaaS', 'Leads',
  'imgs/travelperk-portada.jpg', 'Caso de éxito TravelPerk - SaaS de gestión de viajes', 'imgs/travel-logo-white.png',
  'Soluciones de viaje empresarial eficientes y flexibles, tanto online como offline. Plataforma líder en la gestión de viajes de negocios, ofreciendo una amplia gama de servicios para facilitar los viajes corporativos.',
  'Su objetivo inicial era aumentar el número de empresas que utilizan su plataforma para gestionar sus viajes de negocios y mejorar la eficiencia de sus operaciones de viaje. Inicialmente gestionásemos las campañas de Google Ads para España aunque, tiempo más tarde, pasamos a gestionarlas a nivel global. Nuestro reto era reducir los costes por conversión a MQL de las campañas en Google Ads, mejorando así la rentabilidad del negocio y de la inversión publicitaria. Además de aumentar el número de maximizar el volumen de conversiones sin perder la calidad del lead, con foco a MQL y SQL.',
  'imgs/travelperk.webp', 'Imagen representativa del caso TravelPerk',
  'Para conseguir los resultados reestructuramos las campañas y controlamos las concordancias de las palabras clave así como de las KW negativas. El truco, optimizar, optimizar y optimizar las cuentas adaptándonos al momento de cada mercado además de mejorar la tasa de conversión de las landings.',
  17, true
);
insert into public.case_study_results (case_study_id, value, label, position) values ('ff22ba45-5c51-421a-81d0-d629729b282b', '+15%', 'MQL', 1);
insert into public.case_study_results (case_study_id, value, label, position) values ('ff22ba45-5c51-421a-81d0-d629729b282b', '+16%', 'SQL', 2);
insert into public.case_study_results (case_study_id, value, label, position) values ('ff22ba45-5c51-421a-81d0-d629729b282b', '-38 €', 'CPA', 3);
insert into public.case_study_testimonials (case_study_id, highlight, quote, author_name, author_role, position) values ('ff22ba45-5c51-421a-81d0-d629729b282b', 'esfuerzo y la atención al detalle', 'Gracias por el esfuerzo y la atención al detalle con la que lleváis nuestras cuentas. Estamos impresionados con cómo gestionáis nuestra inversión en medios digitales y nos encanta ver que nuestro ROI mejora drásticamente mes a mes. ¡Es un placer trabajar con un equipo tan profesional que continúa superando nuestros objetivos y expectativas!', 'KATIE ANDERTON', 'Chief Adquisition Manager, Travelperk', 1);

-- Vasquiat
insert into public.case_studies (id, slug, brand_name, sector, resultado, cover_image_url, cover_image_alt, logo_url, description, challenge_text, mid_image_url, mid_image_alt, solution_text, position, is_active) values (
  '93d6b38e-92a7-4363-951a-8ee2763308ec', 'vasquiat', 'Vasquiat', 'Moda & Lifestyle', 'Ventas',
  'imgs/vasquiat-portada.jpg', 'Caso de éxito Vasquiat - Marketplace de moda y lujo', 'imgs/vasquiat-logo.png',
  'Vasquiat no es solo un marketplace; es una ventana al mundo del lujo y la moda contemporánea. Su propósito es destacar y presentar las marcas emergentes más prometedoras del panorama global. La sofisticación, innovación y un toque vanguardista definen a Vasquiat, convirtiéndola en una referencia en la industria de la moda.',
  'A pesar de su prometedora propuesta, Vasquiat enfrentó el desafío de incrementar sus ventas a nivel internacional y optimizar su retorno de inversión. Para una marca emergente, cada paso es esencial, y la visibilidad y confianza son fundamentales para consolidar su posición en el mercado.',
  'imgs/vasquiat.webp', 'Imagen representativa del caso Vasquiat',
  'Empezamos a colaborar en 2020. Primero, diseñamos una estrategia holística que abarcó todo el embudo de marketing. Implementamos campañas para aumentar la visibilidad en nuevas audiencias, teniendo en cuenta que su propuesta innovadora debía llegar a quienes aún no conocían a Vasquiat. A esto se sumó nuestra estrategia en buscadores y shopping, que potenciaba la consideración de la marca.

Segundo, fortalecimos la relación con clientes actuales mediante campañas de remarketing, con el objetivo de maximizar el valor a lo largo del tiempo de cada cliente. Paralelamente, aprovechamos las capacidades nativas de Facebook e Instagram para capturar datos a través de formularios, permitiendo a Vasquiat mantener una comunicación directa y valiosa mediante newsletters a sus potenciales clientes.',
  18, true
);
insert into public.case_study_results (case_study_id, value, label, position) values ('93d6b38e-92a7-4363-951a-8ee2763308ec', '+433%', 'Usuarios', 1);
insert into public.case_study_results (case_study_id, value, label, position) values ('93d6b38e-92a7-4363-951a-8ee2763308ec', '+70%', 'Pedidos', 2);
insert into public.case_study_results (case_study_id, value, label, position) values ('93d6b38e-92a7-4363-951a-8ee2763308ec', '5', 'ROAS Medio', 3);
insert into public.case_study_testimonials (case_study_id, highlight, quote, author_name, author_role, position) values ('93d6b38e-92a7-4363-951a-8ee2763308ec', 'Los resultados que nos han generado han sido espectaculares', 'Cada campaña que lanzamos sigue siendo un éxito. Se exigen al máximo. Lo que creo que hace que llevemos tanto tiempo colaborando con ellos y sigamos colaborando es sin duda es el compromiso de su equipo con nuestra empresa. Les consideramos parte del equipo y realmente siempre están ahí, y con una predisposición increíble, manteniendo el nivel tan alto como el primer día.', 'RAFA BLANC', 'Fundador y CEO, Vasquiat', 1);

-- WeTribu
insert into public.case_studies (id, slug, brand_name, sector, resultado, cover_image_url, cover_image_alt, logo_url, description, challenge_text, mid_image_url, mid_image_alt, solution_text, position, is_active) values (
  'f29ac967-655b-4e8a-ad78-e112d3325064', 'wetribu', 'WeTribu', 'Servicios B2B & SaaS', 'Leads',
  'imgs/wetribu-portada.jpg', 'Caso de éxito WeTribu - Comunidad de CEOs y fundadores', 'imgs/wetribu-logo.avif',
  'WeTribu es una comunidad compuesta por CEOs y fundadores, su propósito trasciende el simple intercambio de experiencias. Buscan colectivamente generar un impacto sustancial, tanto en sus respectivas organizaciones como en la sociedad en general. Su visión clara es ampliar este círculo de influencia, sumando más miembros a su tribu.',
  'Con el horizonte enfocado en las ciudades de Barcelona y Madrid, el principal desafío de WeTribu fue claro pero ambicioso: atraer, de manera efectiva y significativa, a nuevos miembros que resuenen con sus ideales y objetivos.',
  'imgs/wetribu.webp', 'Imagen representativa del caso WeTribu',
  'Para captar esas mentes brillantes, elegimos dos gigantes del mundo digital: Meta y Linkedin. Diseñamos campañas específicas que no sólo comunicaran, sino que también conectaran emocionalmente con potenciales miembros. Nuestro mensaje enfatiza la propuesta de valor única de WeTribu, una que invoca un sentimiento de pertenencia y propósito.

La dinámica digital exige adaptabilidad. Por ello, adoptamos un enfoque iterativo, probando diferentes segmentaciones y creatividades. Este proceso de mejora continua no sólo garantizó que estuviéramos alineados con las demandas cambiantes de nuestra audiencia, sino que también aseguró que atrajéramos leads de la más alta calidad.',
  19, true
);
insert into public.case_study_results (case_study_id, value, label, position) values ('f29ac967-655b-4e8a-ad78-e112d3325064', '+47%', 'Leads', 1);
insert into public.case_study_results (case_study_id, value, label, position) values ('f29ac967-655b-4e8a-ad78-e112d3325064', '-55%', 'Bajada del CPL', 2);
