// title/description тематичних сторінок пресетів (round 38) у 4 мовах.
// Потрібні синхронно (SeoHead, prerender, тести), тому тут, а не в
// перекладах. Тексти сторінок — translation.json: presetPages.<slug>.*
// і seoContent.<slug>.*. Обмеження (тест presetPages.test.mjs):
// title ≤ 60 символів, description 120–160, унікальні по всьому сайту.

export const PRESET_PAGES_META = {
  "presetsPortrait": {
    "uk": {
      "title": "Пресети для портретів онлайн — м'які й драматичні",
      "description": "Безкоштовні пресети для портретних фото: м'які, драматичні, природне світло й студійний стиль. Порівняння «до/після», працює в браузері."
    },
    "en": {
      "title": "Portrait Presets Online — Soft, Dramatic, Studio",
      "description": "Free presets for portrait photos: soft, dramatic, natural light and studio looks. Before/after comparison, adjustable strength, works in your browser."
    },
    "ru": {
      "title": "Пресеты для портретов онлайн — мягкие и драматичные",
      "description": "Бесплатные пресеты для портретных фото: мягкие, драматичные, естественный свет и студийный стиль. Сравнение «до/после», работает в браузере."
    },
    "es": {
      "title": "Filtros para retratos online: suaves y dramáticos",
      "description": "Filtros gratis para fotos de retrato: estilos suaves, dramáticos, de luz natural y de estudio. Comparación antes/después y funciona en el navegador."
    }
  },
  "presetsNature": {
    "uk": {
      "title": "Пресети для фото природи: ліс, море, золота година",
      "description": "Пресети для пейзажів онлайн: тепла золота година, глибокий ліс, бірюзове море й «оживлення» похмурих кадрів. Безкоштовно, без реєстрації."
    },
    "en": {
      "title": "Nature Photo Presets: Forest, Sea, Golden Hour",
      "description": "Landscape presets online: warm golden hour, deep forest greens, turquoise sea and fixes for dull overcast shots. Free, no sign-up, runs in your browser."
    },
    "ru": {
      "title": "Пресеты для фото природы: лес, море, золотой час",
      "description": "Пресеты для пейзажей онлайн: тёплый золотой час, глубокий лес, бирюзовое море и «оживление» пасмурных кадров. Бесплатно, без регистрации."
    },
    "es": {
      "title": "Filtros para fotos de naturaleza: bosque y mar",
      "description": "Filtros para paisajes online: hora dorada cálida, verdes profundos de bosque, mar turquesa y arreglos para fotos de días nublados. Gratis y sin registro."
    }
  },
  "presetsUrban": {
    "uk": {
      "title": "Міські пресети для фото: вулиця й мінімалізм",
      "description": "Пресети для вуличної фотографії й архітектури: плівкова вулиця, світлий мінімалізм і кіношний бірюзово-помаранчевий стиль. Онлайн і безкоштовно."
    },
    "en": {
      "title": "City Photo Presets: Street, Minimal, Teal & Orange",
      "description": "Presets for street photography and architecture: a film-like street look, bright minimalism and cinematic teal and orange. Free and online."
    },
    "ru": {
      "title": "Городские пресеты для фото: улица и минимализм",
      "description": "Пресеты для уличной фотографии и архитектуры: плёночная улица, светлый минимализм и киношный бирюзово-оранжевый стиль. Онлайн и бесплатно."
    },
    "es": {
      "title": "Filtros urbanos para fotos: calle y minimalismo",
      "description": "Filtros para fotografía callejera y arquitectura: calle con aire de película, minimalismo luminoso y el estilo cinematográfico turquesa y naranja."
    }
  },
  "presetsNight": {
    "uk": {
      "title": "Пресети для нічних фото: неон і вогні міста",
      "description": "Обробіть нічне фото онлайн: пресети для неонових вивісок, вогнів міста, атмосферних темних кадрів і порятунку знімків при слабкому світлі."
    },
    "en": {
      "title": "Night Photo Presets: Neon and City Lights",
      "description": "Edit night photos online: presets for neon signs, city lights, moody dark shots and rescuing pictures taken in low light. Free, right in your browser."
    },
    "ru": {
      "title": "Пресеты для ночных фото: неон и огни города",
      "description": "Обработайте ночное фото онлайн: пресеты для неоновых вывесок, огней города, атмосферных тёмных кадров и спасения снимков при слабом свете."
    },
    "es": {
      "title": "Filtros para fotos nocturnas: neón y ciudad",
      "description": "Edita fotos nocturnas online: filtros para letreros de neón, luces de ciudad, tomas oscuras con ambiente y para rescatar fotos hechas con poca luz."
    }
  },
  "presetsSummer": {
    "uk": {
      "title": "Літні пресети для фото: пляж, сонце, подорожі",
      "description": "Пресети для фото з відпустки: бірюзове море, сонячні кольори, теплі вечори й ретро-ефект плівкової «мильниці». Безкоштовно, прямо в браузері."
    },
    "en": {
      "title": "Summer Photo Presets: Beach, Sun and Travel",
      "description": "Presets for vacation photos: turquoise sea, sunny colors, warm evenings and a retro disposable-camera look. Free, no sign-up, works in your browser."
    },
    "ru": {
      "title": "Летние пресеты для фото: пляж, солнце, путешествия",
      "description": "Пресеты для фото из отпуска: бирюзовое море, солнечные цвета, тёплые вечера и ретро-эффект плёночной «мыльницы». Бесплатно, прямо в браузере."
    },
    "es": {
      "title": "Filtros de verano para fotos: playa, sol y viajes",
      "description": "Filtros para fotos de vacaciones: mar turquesa, colores soleados, tardes cálidas y un efecto retro de cámara desechable. Gratis, en tu navegador."
    }
  },
  "presetsAuto": {
    "uk": {
      "title": "Пресети для фото авто: глянець, ніч, захід сонця",
      "description": "Пресети для автомобільних фото: глянцевий шоурум, темний драматичний гараж і теплий захід сонця. Застосуйте онлайн і порівняйте «до/після»."
    },
    "en": {
      "title": "Car Photo Presets: Showroom Gloss, Night, Sunset",
      "description": "Presets for automotive photos: glossy showroom look, dark dramatic garage and warm sunset tones. Apply online and compare before and after."
    },
    "ru": {
      "title": "Пресеты для фото авто: глянец, ночь, закат",
      "description": "Пресеты для автомобильных фото: глянцевый шоурум, тёмный драматичный гараж и тёплый закат. Примените онлайн и сравните «до/после»."
    },
    "es": {
      "title": "Filtros para fotos de coches: brillo y atardecer",
      "description": "Filtros para fotos de automóviles: brillo de concesionario, garaje oscuro y dramático y tonos cálidos de atardecer. Aplícalos online y compara."
    }
  },
  "presetsAutumn": {
    "uk": {
      "title": "Осінні пресети для фото онлайн — золото й затишок",
      "description": "Осінні пресети безкоштовно: яскраве золоте й багряне листя, затишні теплі кадри й атмосферні дощові фото. Застосуйте онлайн і порівняйте «до/після»."
    },
    "en": {
      "title": "Autumn Photo Presets Online — Golden and Cozy",
      "description": "Free fall presets: vivid golden and crimson leaves, cozy warm shots and moody rainy-day photos. Apply online and compare before and after instantly."
    },
    "ru": {
      "title": "Осенние пресеты для фото онлайн — золото и уют",
      "description": "Осенние пресеты бесплатно: яркая золотая и багряная листва, уютные тёплые кадры и атмосферные дождливые фото. Примените онлайн и сравните «до/после»."
    },
    "es": {
      "title": "Filtros de otoño para fotos online: dorado y acogedor",
      "description": "Filtros de otoño gratis: hojas doradas y carmesí más vivas, fotos cálidas y acogedoras e imágenes lluviosas con ambiente. Aplícalos online y compara."
    }
  },
  "presetsWinter": {
    "uk": {
      "title": "Зимові й новорічні пресети для фото онлайн",
      "description": "Пресети для зимових і новорічних фото: білий сніг без синяви, морозні тони, теплі вогні гірлянд і затишні кадри біля ялинки. Безкоштовно."
    },
    "en": {
      "title": "Winter and Christmas Photo Presets Online",
      "description": "Presets for winter and holiday photos: white snow without a blue cast, frosty tones, warm string lights and cozy shots by the tree. Free and online."
    },
    "ru": {
      "title": "Зимние и новогодние пресеты для фото онлайн",
      "description": "Пресеты для зимних и новогодних фото: белый снег без синевы, морозные тона, тёплые огни гирлянд и уютные кадры у ёлки. Бесплатно и онлайн."
    },
    "es": {
      "title": "Filtros de invierno y Navidad para fotos online",
      "description": "Filtros para fotos de invierno y Navidad: nieve blanca sin tono azul, tonos helados, luces cálidas de guirnaldas y fotos junto al árbol. Gratis."
    }
  },
  "presetsFilm": {
    "uk": {
      "title": "Ефект плівки на фото онлайн — ретро й вінтаж пресети",
      "description": "Плівкові пресети онлайн: аналогова плівка, 35 мм із зерном, вінтаж, ретро 70-х, 80-х і 90-х, ломо, полароїд, сепія та нуар. Безкоштовно."
    },
    "en": {
      "title": "Film Effect Presets Online — Retro and Vintage",
      "description": "Film presets online: analog color, 35mm grain, vintage, 70s, 80s and 90s retro, Lomo, Polaroid, sepia and noir. Free, runs right in your browser."
    },
    "ru": {
      "title": "Эффект плёнки на фото онлайн — ретро и винтаж",
      "description": "Плёночные пресеты онлайн: аналоговая плёнка, 35 мм с зерном, винтаж, ретро 70-х, 80-х и 90-х, ломо, полароид, сепия и нуар. Бесплатно."
    },
    "es": {
      "title": "Efecto película online: filtros retro y vintage",
      "description": "Filtros de película online: color analógico, grano de 35 mm, vintage, retro de los 70, 80 y 90, lomo, Polaroid, sepia y noir. Gratis, en el navegador."
    }
  },
  "presetsCinematic": {
    "uk": {
      "title": "Кінематографічні пресети: фото як кадр із фільму",
      "description": "Кіношна кольорокорекція фото онлайн: бірюзово-помаранчевий контраст, темний настрій, теплі плівкові тони й чорно-біла класика. Без реєстрації."
    },
    "en": {
      "title": "Cinematic Presets: Make Photos Look Like Film",
      "description": "Movie-style color grading online: teal and orange contrast, moody dark tones, warm film colors and black and white classics. No sign-up needed."
    },
    "ru": {
      "title": "Кинематографичные пресеты: фото как кадр из фильма",
      "description": "Киношная цветокоррекция фото онлайн: бирюзово-оранжевый контраст, тёмное настроение, тёплые плёночные тона и чёрно-белая классика. Без регистрации."
    },
    "es": {
      "title": "Filtros cinematográficos: fotos como de película",
      "description": "Etalonaje de cine para fotos online: contraste turquesa y naranja, tonos oscuros, colores cálidos de película y clásicos en blanco y negro. Sin registro."
    }
  },
  "presetsBrightenDark": {
    "uk": {
      "title": "Як освітлити темне фото онлайн — пресети безкоштовно",
      "description": "Зробіть темне фото світлішим онлайн: пресети піднімають тіні й експозицію без пересвічення неба й вікон. Безкоштовно, фото не йде на сервер."
    },
    "en": {
      "title": "Brighten a Dark Photo Online — Free Presets",
      "description": "Make a dark photo brighter online: presets lift shadows and exposure without blowing out skies or windows. Free, and your photo never leaves the device."
    },
    "ru": {
      "title": "Как осветлить тёмное фото онлайн — пресеты бесплатно",
      "description": "Сделайте тёмное фото светлее онлайн: пресеты поднимают тени и экспозицию без пересвета неба и окон. Бесплатно, фото не уходит на сервер."
    },
    "es": {
      "title": "Aclarar una foto oscura online: filtros gratis",
      "description": "Haz más luminosa una foto oscura online: los filtros levantan sombras y exposición sin quemar el cielo ni las ventanas. Gratis y sin subir la foto."
    }
  },
  "presetsProductPhoto": {
    "uk": {
      "title": "Фото товару для OLX і Prom: пресети онлайн",
      "description": "Пресети для фото товарів: більше світла, білий без жовтизни й чіткі деталі для оголошень на OLX, Prom і Rozetka. Безкоштовно, у браузері."
    },
    "en": {
      "title": "Product Photo Presets: Bright, White and Crisp",
      "description": "Presets for product photos: more light, whites without a yellow cast and crisp details for marketplace listings and online stores. Free, in your browser."
    },
    "ru": {
      "title": "Фото товара для OLX и Prom: пресеты онлайн",
      "description": "Пресеты для фото товаров: больше света, белый без желтизны и чёткие детали для объявлений на OLX, Prom и Rozetka. Бесплатно, в браузере."
    },
    "es": {
      "title": "Fotos de producto: filtros para anuncios online",
      "description": "Filtros para fotos de productos: más luz, blancos sin tono amarillo y detalles nítidos para anuncios y tiendas online. Gratis, en tu navegador."
    }
  },
  "presetsCarSale": {
    "uk": {
      "title": "Фото авто для продажу: пресети для оголошення",
      "description": "Обробіть фото машини для auto.ria чи OLX: більше світла, чіткі відблиски й видимий салон без зміни кольору кузова. Безкоштовні пресети онлайн."
    },
    "en": {
      "title": "Car Photos for a Sale Listing: Free Presets",
      "description": "Edit photos of the car you're selling: more light, crisp reflections and a visible interior without changing the paint color. Free presets, online."
    },
    "ru": {
      "title": "Фото авто для продажи: пресеты для объявления",
      "description": "Обработайте фото машины для auto.ria или OLX: больше света, чёткие блики и видимый салон без изменения цвета кузова. Бесплатные пресеты онлайн."
    },
    "es": {
      "title": "Fotos de coche para vender: filtros para anuncios",
      "description": "Edita las fotos del coche que vendes: más luz, reflejos nítidos y un interior visible sin cambiar el color de la pintura. Filtros gratis online."
    }
  },
  "presetsFood": {
    "uk": {
      "title": "Пресети для фото їжі: меню, доставка, Instagram",
      "description": "Апетитні фото страв онлайн: теплі соковиті тони, свіжа яскрава зелень або темний ресторанний стиль. Пресети для меню, доставки й Instagram."
    },
    "en": {
      "title": "Food Photo Presets for Menus and Instagram",
      "description": "Make dishes look appetizing online: warm rich tones, fresh bright greens or a dark restaurant style. Presets for menus, delivery pages and Instagram."
    },
    "ru": {
      "title": "Пресеты для фото еды: меню, доставка, Instagram",
      "description": "Аппетитные фото блюд онлайн: тёплые сочные тона, свежая яркая зелень или тёмный ресторанный стиль. Пресеты для меню, доставки и Instagram."
    },
    "es": {
      "title": "Filtros para fotos de comida: carta e Instagram",
      "description": "Platos que abren el apetito online: tonos cálidos e intensos, verdes frescos o un estilo oscuro de restaurante. Filtros para cartas, delivery e Instagram."
    }
  },
  "presetsAvatar": {
    "uk": {
      "title": "Фото на аватарку: пресети для профілю онлайн",
      "description": "Покращіть фото для аватарки: природна шкіра, рівне світло, діловий студійний стиль або чорно-біла класика. Для месенджерів, LinkedIn і резюме."
    },
    "en": {
      "title": "Profile Picture Presets Online — Natural Look",
      "description": "Improve your profile photo: natural skin, even light, a clean studio look or classic black and white. For messengers, LinkedIn and résumés. Free."
    },
    "ru": {
      "title": "Фото на аватарку: пресеты для профиля онлайн",
      "description": "Улучшите фото для аватарки: естественная кожа, ровный свет, деловой студийный стиль или чёрно-белая классика. Для мессенджеров, LinkedIn и резюме."
    },
    "es": {
      "title": "Filtros para foto de perfil online: aspecto natural",
      "description": "Mejora tu foto de perfil: piel natural, luz uniforme, estilo de estudio profesional o blanco y negro clásico. Para mensajería, LinkedIn y currículum."
    }
  },
  "presetsWedding": {
    "uk": {
      "title": "Весільні пресети онлайн: світлі, плівкові, Ч/Б",
      "description": "Пресети для весільних фото й love story: світлий повітряний стиль, ніжна пастель, тепла плівка й позачасова чорно-біла класика. Безкоштовно."
    },
    "en": {
      "title": "Wedding Photo Presets Online: Airy, Film, B&W",
      "description": "Presets for wedding and engagement photos: a bright airy style, soft pastels, warm film and timeless black and white. Free, right in your browser."
    },
    "ru": {
      "title": "Свадебные пресеты онлайн: светлые, плёночные, Ч/Б",
      "description": "Пресеты для свадебных фото и love story: светлый воздушный стиль, нежная пастель, тёплая плёнка и вневременная чёрно-белая классика. Бесплатно."
    },
    "es": {
      "title": "Filtros para fotos de boda: luminosos, película, B/N",
      "description": "Filtros para fotos de boda y preboda: estilo luminoso y etéreo, pasteles suaves, película cálida y blanco y negro atemporal. Gratis, en el navegador."
    }
  }
};
