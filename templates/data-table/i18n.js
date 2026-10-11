/* Data table — ScreenTinker community template. MIT.
   The template's own words and the starting points' sample tables in ten languages, picked by the
   primary subtag of the "locale" setting (empty = the screen's language), falling back to English.
   English lives in app.js (PRESETS); every other language gives here, per starting point:
     title, subtitle, footer, disclosure — the texts ({date} = the rates' date, written by Intl);
     head — the heading row, column for column the same as the English one;
     cells — English cell text → translated text ({m} = an amount, written by Intl in `money`).
   Names (teams, people, suppliers) are fictional and stay as they are. Numbers are formatted by
   Intl at run time, never here. */
var DATA_TABLE_I18N = {
  en: {
    words: {
      updated: 'Updated',
      limit: 'First {shown} of {total} rows',
      column: 'Column {n}'
    },
    form: { w: 'W', d: 'D', l: 'L' },
    lead: ['pts', 'points', 'total', 'score']
  },

  de: {
    words: {
      updated: 'Aktualisiert',
      limit: 'Erste {shown} von {total} Zeilen',
      column: 'Spalte {n}'
    },
    form: { w: 'S', d: 'U', l: 'N' },
    formHead: ['form'],
    lead: ['pkt', 'pkt.', 'punkte', 'gesamt', 'summe'],
    colours: { rot: 'red', gelb: 'amber', orange: 'amber', 'grün': 'green', blau: 'blue', lila: 'purple', grau: 'grey' },
    money: { currency: 'EUR', scale: 1 },
    presets: {
      league: {
        title: 'Northwind Sonntagsliga',
        subtitle: 'Erste Division · Tabelle nach dem 18. Spieltag',
        footer: 'Die ersten vier spielen um den Northwind-Pokal · Die letzten zwei steigen ab',
        head: ['Pl.', 'Verein', 'Sp.', 'S', 'U', 'N', 'T', 'GT', 'Diff.', 'Pkt.', 'Form']
      },
      rates: {
        title: 'Sparzinsen',
        subtitle: 'Northwind Savings · Zinssätze gültig ab {date}',
        footer: 'Die vollständigen Bedingungen zu jedem Konto erhalten Sie in der Filiale',
        disclosure: 'Der effektive Zins zeigt, wie hoch der Zins wäre, wenn die Zinsen einmal im Jahr gezahlt und mitverzinst würden. ' +
          'Der Zins p.a. ist der vertraglich vereinbarte Nominalzins vor Steuern. Die Zinssätze sind variabel, sofern das Konto keine feste Laufzeit hat, und können sich ändern. ' +
          'Beim Festgeld sind Abhebungen vor Fälligkeit nicht möglich. Beispielwerte nur zur Veranschaulichung: Northwind Savings ist ein erfundener Name.',
        head: ['Konto', 'Laufzeit', 'Effektiver Zins', 'Zins p.a.', 'Zinsen', 'Min.-Anlage'],
        cells: {
          'Easy Access Saver': 'Tagesgeld',
          'Bonus Saver': 'Bonus-Sparkonto',
          'Notice Saver 95': 'Kündigungsgeld 95',
          'Regular Saver': 'Sparplan',
          'Fixed Rate Bond': 'Festgeld',
          'Tax-free Saver': 'Steuerfrei-Sparen',
          'Junior Saver': 'Junior-Sparkonto',
          'No term': 'Ohne Laufzeit',
          '95 days\' notice': '95 Tage Kündigung',
          '12 months': '12 Monate',
          '1 year': '1 Jahr',
          '2 years': '2 Jahre',
          '3 years': '3 Jahre',
          'Monthly': 'Monatlich',
          'Annually': 'Jährlich',
          'At maturity': 'Bei Fälligkeit',
          '{m} a month': '{m} im Monat'
        }
      },
      stock: {
        title: 'Lagerbestand',
        subtitle: 'Northwind Supply · Lager B',
        footer: 'Rot: unter 5 auf Lager · Gelb: unter 15 · Alle 15 Minuten neu gezählt',
        head: ['Art.-Nr.', 'Produkt', 'Fach', 'Bestand', 'Nachbestellen ab', 'Lieferant'],
        cells: {
          'Cordless drill 18V': 'Akku-Bohrschrauber 18 V',
          'Impact driver 18V': 'Schlagschrauber 18 V',
          'Wood screws 4×40 (200)': 'Holzschrauben 4×40 (200)',
          'Wall plugs, brown (100)': 'Dübel, braun (100)',
          'Laser level': 'Laser-Wasserwaage',
          'Tape measure 8 m': 'Maßband 8 m',
          'Safety glasses': 'Schutzbrille',
          'Work gloves, size L': 'Arbeitshandschuhe, Gr. L',
          'Extension lead 10 m': 'Verlängerungskabel 10 m',
          'LED work light': 'LED-Arbeitsleuchte',
          'Sanding discs P120 (50)': 'Schleifscheiben P120 (50)',
          'Masking tape 48 mm': 'Malerkrepp 48 mm'
        }
      },
      generic: {
        title: 'Schulungen heute',
        subtitle: 'Northwind Lernzentrum · Ebene 2',
        footer: 'Plätze am Empfang oder im Intranet buchen',
        head: ['Kurs', 'Trainer:in', 'Raum', 'Beginn', 'Ende', 'Freie Plätze'],
        cells: {
          'Fire safety induction': 'Brandschutz-Einweisung',
          'Excel: pivot tables': 'Excel: Pivot-Tabellen',
          'First aid refresher': 'Erste Hilfe auffrischen',
          'Leading hybrid teams': 'Hybride Teams führen',
          'Customer conversations': 'Kundengespräche',
          'Data protection basics': 'Datenschutz-Grundlagen',
          'Presenting with confidence': 'Sicher präsentieren',
          'Excel: dashboards': 'Excel: Dashboards',
          'Wellbeing at work': 'Wohlbefinden im Job',
          'Room 2.01': 'Raum 2.01',
          'Room 2.04': 'Raum 2.04',
          'Room 2.06': 'Raum 2.06',
          'Lab 2.10': 'Labor 2.10'
        }
      }
    }
  },

  es: {
    words: {
      updated: 'Actualizado',
      limit: 'Primeras {shown} de {total} filas',
      column: 'Columna {n}'
    },
    form: { w: 'G', d: 'E', l: 'P' },
    formHead: ['forma', 'racha'],
    lead: ['pts', 'puntos', 'total'],
    colours: { rojo: 'red', ambar: 'amber', 'ámbar': 'amber', naranja: 'amber', amarillo: 'amber', verde: 'green', azul: 'blue', morado: 'purple', gris: 'grey' },
    money: { currency: 'EUR', scale: 1 },
    presets: {
      league: {
        title: 'Liga Dominical Northwind',
        subtitle: 'Primera División · Clasificación tras la jornada 18',
        footer: 'Los cuatro primeros se clasifican para la Copa Northwind · Los dos últimos descienden',
        head: ['Pos', 'Equipo', 'PJ', 'G', 'E', 'P', 'GF', 'GC', 'DG', 'Pts', 'Forma']
      },
      rates: {
        title: 'Tipos de ahorro',
        subtitle: 'Northwind Savings · Tipos vigentes desde el {date}',
        footer: 'Consulte en la oficina las condiciones completas de cada cuenta',
        disclosure: 'La TAE (tasa anual equivalente) indica cuál sería el tipo de interés si los intereses se pagaran y capitalizaran una vez al año. ' +
          'El TIN es el tipo de interés contractual antes de impuestos. Los tipos son variables salvo en las cuentas a plazo fijo y pueden cambiar. ' +
          'Los depósitos a plazo fijo no permiten retiradas antes del vencimiento. Cifras de ejemplo solo a título ilustrativo: Northwind Savings es un nombre ficticio.',
        head: ['Cuenta', 'Plazo', 'TAE', 'TIN', 'Pago de intereses', 'Depósito mín.'],
        cells: {
          'Easy Access Saver': 'Cuenta Ahorro Fácil',
          'Bonus Saver': 'Cuenta Ahorro Bonus',
          'Notice Saver 95': 'Ahorro con preaviso 95',
          'Regular Saver': 'Ahorro periódico',
          'Fixed Rate Bond': 'Depósito a plazo fijo',
          'Tax-free Saver': 'Ahorro exento',
          'Junior Saver': 'Ahorro Junior',
          'No term': 'Sin plazo',
          '95 days\' notice': 'Preaviso de 95 días',
          '12 months': '12 meses',
          '1 year': '1 año',
          '2 years': '2 años',
          '3 years': '3 años',
          'Monthly': 'Mensual',
          'Annually': 'Anual',
          'At maturity': 'Al vencimiento',
          '{m} a month': '{m} al mes'
        }
      },
      stock: {
        title: 'Niveles de stock',
        subtitle: 'Northwind Supply · Almacén B',
        footer: 'Rojo: menos de 5 en stock · Ámbar: menos de 15 · Recuento cada 15 minutos',
        head: ['Ref.', 'Producto', 'Ubicación', 'En stock', 'Pedir en', 'Proveedor'],
        cells: {
          'Cordless drill 18V': 'Taladro inalámbrico 18 V',
          'Impact driver 18V': 'Atornillador de impacto 18 V',
          'Wood screws 4×40 (200)': 'Tornillos para madera 4×40 (200)',
          'Wall plugs, brown (100)': 'Tacos, marrones (100)',
          'Laser level': 'Nivel láser',
          'Tape measure 8 m': 'Cinta métrica 8 m',
          'Safety glasses': 'Gafas de seguridad',
          'Work gloves, size L': 'Guantes de trabajo, talla L',
          'Extension lead 10 m': 'Alargador 10 m',
          'LED work light': 'Foco de trabajo LED',
          'Sanding discs P120 (50)': 'Discos de lija P120 (50)',
          'Masking tape 48 mm': 'Cinta de carrocero 48 mm'
        }
      },
      generic: {
        title: 'Formación de hoy',
        subtitle: 'Centro de Formación Northwind · Planta 2',
        footer: 'Reserve su plaza en recepción o en la intranet',
        head: ['Sesión', 'Formador', 'Sala', 'Inicio', 'Fin', 'Plazas libres'],
        cells: {
          'Fire safety induction': 'Introducción a la seguridad contra incendios',
          'Excel: pivot tables': 'Excel: tablas dinámicas',
          'First aid refresher': 'Repaso de primeros auxilios',
          'Leading hybrid teams': 'Liderar equipos híbridos',
          'Customer conversations': 'Conversaciones con clientes',
          'Data protection basics': 'Protección de datos básica',
          'Presenting with confidence': 'Presentar con seguridad',
          'Excel: dashboards': 'Excel: paneles',
          'Wellbeing at work': 'Bienestar en el trabajo',
          'Room 2.01': 'Sala 2.01',
          'Room 2.04': 'Sala 2.04',
          'Room 2.06': 'Sala 2.06',
          'Lab 2.10': 'Aula 2.10'
        }
      }
    }
  },

  fr: {
    words: {
      updated: 'Mis à jour',
      limit: '{shown} premières lignes sur {total}',
      column: 'Colonne {n}'
    },
    form: { w: 'V', d: 'N', l: 'D' },
    formHead: ['forme'],
    lead: ['pts', 'points', 'total'],
    colours: { rouge: 'red', orange: 'amber', jaune: 'amber', ambre: 'amber', vert: 'green', bleu: 'blue', violet: 'purple', gris: 'grey' },
    money: { currency: 'EUR', scale: 1 },
    presets: {
      league: {
        title: 'Ligue du dimanche Northwind',
        subtitle: 'Division 1 · Classement après la 18e journée',
        footer: 'Les quatre premiers se qualifient pour la Coupe Northwind · Les deux derniers sont relégués',
        head: ['Pl.', 'Équipe', 'J', 'G', 'N', 'P', 'BP', 'BC', 'Diff.', 'Pts', 'Forme']
      },
      rates: {
        title: 'Taux d’épargne',
        subtitle: 'Northwind Savings · Taux en vigueur à partir du {date}',
        footer: 'Demandez en agence les conditions complètes de chaque compte',
        disclosure: 'Le taux actuariel indique ce que serait le taux d’intérêt si les intérêts étaient versés et capitalisés une fois par an. ' +
          'Le taux brut annuel est le taux contractuel avant impôts. Les taux sont variables, sauf pour les comptes à terme, et peuvent changer. ' +
          'Les comptes à terme ne permettent aucun retrait avant l’échéance. Chiffres donnés à titre d’exemple : Northwind Savings est un nom fictif.',
        head: ['Compte', 'Durée', 'Taux actuariel', 'Taux brut annuel', 'Versement des intérêts', 'Dépôt min.'],
        cells: {
          'Easy Access Saver': 'Livret disponible',
          'Bonus Saver': 'Livret bonus',
          'Notice Saver 95': 'Épargne préavis 95',
          'Regular Saver': 'Épargne régulière',
          'Fixed Rate Bond': 'Compte à terme',
          'Tax-free Saver': 'Livret défiscalisé',
          'Junior Saver': 'Livret jeune',
          'No term': 'Sans durée',
          '95 days\' notice': 'Préavis de 95 jours',
          '12 months': '12 mois',
          '1 year': '1 an',
          '2 years': '2 ans',
          '3 years': '3 ans',
          'Monthly': 'Mensuel',
          'Annually': 'Annuel',
          'At maturity': 'À l’échéance',
          '{m} a month': '{m} par mois'
        }
      },
      stock: {
        title: 'Niveaux de stock',
        subtitle: 'Northwind Supply · Entrepôt B',
        footer: 'Rouge : moins de 5 en stock · Orange : moins de 15 · Recompté toutes les 15 minutes',
        head: ['Réf.', 'Produit', 'Empl.', 'En stock', 'Seuil de commande', 'Fournisseur'],
        cells: {
          'Cordless drill 18V': 'Perceuse sans fil 18 V',
          'Impact driver 18V': 'Visseuse à choc 18 V',
          'Wood screws 4×40 (200)': 'Vis à bois 4×40 (200)',
          'Wall plugs, brown (100)': 'Chevilles, marron (100)',
          'Laser level': 'Niveau laser',
          'Tape measure 8 m': 'Mètre ruban 8 m',
          'Safety glasses': 'Lunettes de protection',
          'Work gloves, size L': 'Gants de travail, taille L',
          'Extension lead 10 m': 'Rallonge 10 m',
          'LED work light': 'Projecteur de chantier LED',
          'Sanding discs P120 (50)': 'Disques abrasifs P120 (50)',
          'Masking tape 48 mm': 'Ruban de masquage 48 mm'
        }
      },
      generic: {
        title: 'Formations du jour',
        subtitle: 'Centre de formation Northwind · Niveau 2',
        footer: 'Réservez une place à l’accueil ou sur l’intranet',
        head: ['Session', 'Formateur', 'Salle', 'Début', 'Fin', 'Places libres'],
        cells: {
          'Fire safety induction': 'Initiation à la sécurité incendie',
          'Excel: pivot tables': 'Excel : tableaux croisés',
          'First aid refresher': 'Recyclage premiers secours',
          'Leading hybrid teams': 'Animer des équipes hybrides',
          'Customer conversations': 'Échanges avec les clients',
          'Data protection basics': 'Bases de la protection des données',
          'Presenting with confidence': 'Présenter avec assurance',
          'Excel: dashboards': 'Excel : tableaux de bord',
          'Wellbeing at work': 'Bien-être au travail',
          'Room 2.01': 'Salle 2.01',
          'Room 2.04': 'Salle 2.04',
          'Room 2.06': 'Salle 2.06',
          'Lab 2.10': 'Labo 2.10'
        }
      }
    }
  },

  hi: {
    words: {
      updated: 'अपडेट',
      limit: '{total} में से पहली {shown} पंक्तियाँ',
      column: 'कॉलम {n}'
    },
    form: { w: 'ज', d: 'ब', l: 'ह' },
    formHead: ['फ़ॉर्म', 'फॉर्म'],
    lead: ['अंक', 'कुल', 'स्कोर'],
    colours: { 'लाल': 'red', 'पीला': 'amber', 'नारंगी': 'amber', 'हरा': 'green', 'नीला': 'blue', 'बैंगनी': 'purple', 'स्लेटी': 'grey' },
    money: { currency: 'INR', scale: 100 },
    presets: {
      league: {
        title: 'Northwind संडे लीग',
        subtitle: 'डिवीज़न वन · मैचवीक 18 के बाद की तालिका',
        footer: 'शीर्ष चार टीमें Northwind कप के लिए क्वालीफ़ाई करती हैं · आखिरी दो टीमें बाहर होती हैं',
        head: ['स्थान', 'टीम', 'मैच', 'जीत', 'बराबर', 'हार', 'गोल', 'विरुद्ध', 'अंतर', 'अंक', 'फ़ॉर्म']
      },
      rates: {
        title: 'बचत ब्याज दरें',
        subtitle: 'Northwind Savings · {date} से लागू दरें',
        footer: 'हर खाते की पूरी शर्तों के लिए शाखा में पूछें',
        disclosure: 'प्रभावी वार्षिक दर बताती है कि अगर ब्याज साल में एक बार दिया और जोड़ा जाए तो ब्याज दर कितनी होगी। ' +
          'सकल वार्षिक दर कर से पहले की अनुबंधित ब्याज दर है। निश्चित अवधि वाले खातों को छोड़कर दरें परिवर्तनशील हैं और बदल सकती हैं। ' +
          'सावधि जमा में परिपक्वता से पहले निकासी नहीं की जा सकती। आँकड़े केवल उदाहरण के लिए हैं: Northwind Savings एक काल्पनिक नाम है।',
        head: ['खाता', 'अवधि', 'प्रभावी दर', 'सकल दर', 'ब्याज भुगतान', 'न्यूनतम जमा'],
        cells: {
          'Easy Access Saver': 'आसान बचत खाता',
          'Bonus Saver': 'बोनस बचत',
          'Notice Saver 95': 'नोटिस बचत 95',
          'Regular Saver': 'नियमित बचत',
          'Fixed Rate Bond': 'सावधि जमा',
          'Tax-free Saver': 'कर-मुक्त बचत',
          'Junior Saver': 'जूनियर बचत',
          'No term': 'कोई अवधि नहीं',
          '95 days\' notice': '95 दिन का नोटिस',
          '12 months': '12 महीने',
          '1 year': '1 साल',
          '2 years': '2 साल',
          '3 years': '3 साल',
          'Monthly': 'मासिक',
          'Annually': 'वार्षिक',
          'At maturity': 'परिपक्वता पर',
          '{m} a month': '{m} प्रति माह'
        }
      },
      stock: {
        title: 'स्टॉक स्तर',
        subtitle: 'Northwind Supply · गोदाम B',
        footer: 'लाल: 5 से कम स्टॉक · पीला: 15 से कम · हर 15 मिनट में दोबारा गिनती',
        head: ['SKU', 'उत्पाद', 'बिन', 'स्टॉक में', 'दोबारा ऑर्डर', 'सप्लायर'],
        cells: {
          'Cordless drill 18V': 'कॉर्डलेस ड्रिल 18V',
          'Impact driver 18V': 'इम्पैक्ट ड्राइवर 18V',
          'Wood screws 4×40 (200)': 'लकड़ी के पेंच 4×40 (200)',
          'Wall plugs, brown (100)': 'वॉल प्लग, भूरे (100)',
          'Laser level': 'लेज़र लेवल',
          'Tape measure 8 m': 'मापने का फीता 8 m',
          'Safety glasses': 'सुरक्षा चश्मा',
          'Work gloves, size L': 'काम के दस्ताने, साइज़ L',
          'Extension lead 10 m': 'एक्सटेंशन कॉर्ड 10 m',
          'LED work light': 'LED वर्क लाइट',
          'Sanding discs P120 (50)': 'सैंडिंग डिस्क P120 (50)',
          'Masking tape 48 mm': 'मास्किंग टेप 48 mm'
        }
      },
      generic: {
        title: 'आज के प्रशिक्षण',
        subtitle: 'Northwind लर्निंग सेंटर · लेवल 2',
        footer: 'फ़्रंट डेस्क पर या इंट्रानेट पर सीट बुक करें',
        head: ['सत्र', 'प्रशिक्षक', 'कमरा', 'शुरू', 'समाप्त', 'खाली सीटें'],
        cells: {
          'Fire safety induction': 'अग्नि सुरक्षा परिचय',
          'Excel: pivot tables': 'Excel: पिवट टेबल',
          'First aid refresher': 'प्राथमिक चिकित्सा पुनश्चर्या',
          'Leading hybrid teams': 'हाइब्रिड टीमों का नेतृत्व',
          'Customer conversations': 'ग्राहकों से बातचीत',
          'Data protection basics': 'डेटा सुरक्षा की बुनियादी बातें',
          'Presenting with confidence': 'आत्मविश्वास से प्रस्तुति',
          'Excel: dashboards': 'Excel: डैशबोर्ड',
          'Wellbeing at work': 'कार्यस्थल पर स्वास्थ्य',
          'Room 2.01': 'कमरा 2.01',
          'Room 2.04': 'कमरा 2.04',
          'Room 2.06': 'कमरा 2.06',
          'Lab 2.10': 'लैब 2.10'
        }
      }
    }
  },

  it: {
    words: {
      updated: 'Aggiornato',
      limit: 'Prime {shown} di {total} righe',
      column: 'Colonna {n}'
    },
    form: { w: 'V', d: 'N', l: 'P' },
    formHead: ['forma'],
    lead: ['pt', 'pti', 'punti', 'totale'],
    colours: { rosso: 'red', arancione: 'amber', giallo: 'amber', ambra: 'amber', verde: 'green', blu: 'blue', viola: 'purple', grigio: 'grey' },
    money: { currency: 'EUR', scale: 1 },
    presets: {
      league: {
        title: 'Lega della Domenica Northwind',
        subtitle: 'Prima Divisione · Classifica dopo la 18ª giornata',
        footer: 'Le prime quattro si qualificano per la Coppa Northwind · Le ultime due retrocedono',
        head: ['Pos', 'Squadra', 'G', 'V', 'N', 'P', 'GF', 'GS', 'DR', 'Pt', 'Forma']
      },
      rates: {
        title: 'Tassi di risparmio',
        subtitle: 'Northwind Savings · Tassi in vigore dal {date}',
        footer: 'Chiedi in filiale le condizioni complete di ogni conto',
        disclosure: 'Il tasso effettivo indica quale sarebbe il tasso di interesse se gli interessi fossero pagati e capitalizzati una volta l’anno. ' +
          'Il tasso lordo annuo è il tasso contrattuale prima delle imposte. I tassi sono variabili, salvo per i conti vincolati, e possono cambiare. ' +
          'I conti vincolati non consentono prelievi prima della scadenza. Cifre di esempio a solo scopo illustrativo: Northwind Savings è un nome di fantasia.',
        head: ['Conto', 'Durata', 'Tasso effettivo', 'Tasso lordo annuo', 'Interessi pagati', 'Deposito min.'],
        cells: {
          'Easy Access Saver': 'Conto deposito libero',
          'Bonus Saver': 'Conto bonus',
          'Notice Saver 95': 'Risparmio con preavviso 95',
          'Regular Saver': 'Piano di risparmio',
          'Fixed Rate Bond': 'Conto vincolato',
          'Tax-free Saver': 'Risparmio esentasse',
          'Junior Saver': 'Conto junior',
          'No term': 'Nessuna durata',
          '95 days\' notice': 'Preavviso di 95 giorni',
          '12 months': '12 mesi',
          '1 year': '1 anno',
          '2 years': '2 anni',
          '3 years': '3 anni',
          'Monthly': 'Mensili',
          'Annually': 'Annuali',
          'At maturity': 'A scadenza',
          '{m} a month': '{m} al mese'
        }
      },
      stock: {
        title: 'Livelli di magazzino',
        subtitle: 'Northwind Supply · Magazzino B',
        footer: 'Rosso: meno di 5 in giacenza · Arancione: meno di 15 · Ricontato ogni 15 minuti',
        head: ['Cod.', 'Prodotto', 'Ubicazione', 'Giacenza', 'Riordino a', 'Fornitore'],
        cells: {
          'Cordless drill 18V': 'Trapano a batteria 18 V',
          'Impact driver 18V': 'Avvitatore a impulsi 18 V',
          'Wood screws 4×40 (200)': 'Viti per legno 4×40 (200)',
          'Wall plugs, brown (100)': 'Tasselli, marroni (100)',
          'Laser level': 'Livella laser',
          'Tape measure 8 m': 'Metro a nastro 8 m',
          'Safety glasses': 'Occhiali di sicurezza',
          'Work gloves, size L': 'Guanti da lavoro, taglia L',
          'Extension lead 10 m': 'Prolunga 10 m',
          'LED work light': 'Lampada da lavoro LED',
          'Sanding discs P120 (50)': 'Dischi abrasivi P120 (50)',
          'Masking tape 48 mm': 'Nastro di carta 48 mm'
        }
      },
      generic: {
        title: 'Formazione di oggi',
        subtitle: 'Centro di formazione Northwind · Piano 2',
        footer: 'Prenota un posto alla reception o sull’intranet',
        head: ['Corso', 'Formatore', 'Aula', 'Inizio', 'Fine', 'Posti liberi'],
        cells: {
          'Fire safety induction': 'Introduzione all’antincendio',
          'Excel: pivot tables': 'Excel: tabelle pivot',
          'First aid refresher': 'Aggiornamento primo soccorso',
          'Leading hybrid teams': 'Guidare team ibridi',
          'Customer conversations': 'Dialogare con i clienti',
          'Data protection basics': 'Privacy: le basi',
          'Presenting with confidence': 'Presentare con sicurezza',
          'Excel: dashboards': 'Excel: dashboard',
          'Wellbeing at work': 'Benessere al lavoro',
          'Room 2.01': 'Aula 2.01',
          'Room 2.04': 'Aula 2.04',
          'Room 2.06': 'Aula 2.06',
          'Lab 2.10': 'Lab 2.10'
        }
      }
    }
  },

  ja: {
    words: {
      updated: '更新',
      limit: '全{total}行中、最初の{shown}行',
      column: '列{n}'
    },
    form: { w: '勝', d: '分', l: '敗' },
    formHead: ['直近', '直近5試合', 'フォーム'],
    lead: ['勝点', '勝ち点', 'ポイント', '合計', '得点合計', 'スコア'],
    colours: { '赤': 'red', '黄': 'amber', 'オレンジ': 'amber', '緑': 'green', '青': 'blue', '紫': 'purple', '灰': 'grey', 'グレー': 'grey' },
    money: { currency: 'JPY', scale: 100 },
    presets: {
      league: {
        title: 'Northwind サンデーリーグ',
        subtitle: '1部 · 第18節終了時点の順位表',
        footer: '上位4チームが Northwind カップに出場 · 下位2チームは降格',
        head: ['順位', 'チーム', '試合', '勝', '分', '敗', '得点', '失点', '得失差', '勝点', '直近']
      },
      rates: {
        title: '預金金利',
        subtitle: 'Northwind Savings · {date}から適用',
        footer: '各口座の詳しい条件は店頭でおたずねください',
        disclosure: '実質年利は、利息を年1回支払って元本に組み入れた場合の金利を示します。' +
          '表面金利（年）は税引前の約定金利です。定期口座を除き金利は変動制で、変更されることがあります。' +
          '定期預金は満期前に引き出せません。数値は説明用の例です。Northwind Savings は架空の名前です。',
        head: ['口座', '期間', '実質年利', '表面金利', '利払い', '最低預入額'],
        cells: {
          'Easy Access Saver': '普通預金',
          'Bonus Saver': 'ボーナス預金',
          'Notice Saver 95': '通知預金 95',
          'Regular Saver': '積立預金',
          'Fixed Rate Bond': '定期預金',
          'Tax-free Saver': '非課税預金',
          'Junior Saver': 'ジュニア預金',
          'No term': 'なし',
          '95 days\' notice': '95日前通知',
          '12 months': '12か月',
          '1 year': '1年',
          '2 years': '2年',
          '3 years': '3年',
          'Monthly': '毎月',
          'Annually': '毎年',
          'At maturity': '満期時',
          '{m} a month': '月{m}'
        }
      },
      stock: {
        title: '在庫状況',
        subtitle: 'Northwind Supply · B倉庫',
        footer: '赤：在庫5未満 · 黄：15未満 · 15分ごとに再集計',
        head: ['品番', '商品', '棚', '在庫数', '発注点', '仕入先'],
        cells: {
          'Cordless drill 18V': '充電式ドリル 18V',
          'Impact driver 18V': 'インパクトドライバー 18V',
          'Wood screws 4×40 (200)': '木ねじ 4×40（200本）',
          'Wall plugs, brown (100)': '壁用プラグ 茶（100個）',
          'Laser level': 'レーザー墨出し器',
          'Tape measure 8 m': 'メジャー 8m',
          'Safety glasses': '保護メガネ',
          'Work gloves, size L': '作業手袋 Lサイズ',
          'Extension lead 10 m': '延長コード 10m',
          'LED work light': 'LED作業灯',
          'Sanding discs P120 (50)': 'サンディングディスク P120（50枚）',
          'Masking tape 48 mm': 'マスキングテープ 48mm'
        }
      },
      generic: {
        title: '本日の研修',
        subtitle: 'Northwind 研修センター · 2階',
        footer: '受付またはイントラネットで席を予約してください',
        head: ['研修', '講師', '部屋', '開始', '終了', '残席'],
        cells: {
          'Fire safety induction': '防火安全の基礎',
          'Excel: pivot tables': 'Excel：ピボットテーブル',
          'First aid refresher': '応急手当の復習',
          'Leading hybrid teams': 'ハイブリッドチームの運営',
          'Customer conversations': 'お客様との対話',
          'Data protection basics': '個人情報保護の基本',
          'Presenting with confidence': '自信を持って発表する',
          'Excel: dashboards': 'Excel：ダッシュボード',
          'Wellbeing at work': '職場のウェルビーイング',
          'Room 2.01': '2.01室',
          'Room 2.04': '2.04室',
          'Room 2.06': '2.06室',
          'Lab 2.10': 'ラボ 2.10'
        }
      }
    }
  },

  nl: {
    words: {
      updated: 'Bijgewerkt',
      limit: 'Eerste {shown} van {total} rijen',
      column: 'Kolom {n}'
    },
    form: { w: 'W', d: 'G', l: 'V' },
    formHead: ['vorm'],
    lead: ['ptn', 'punten', 'totaal', 'score'],
    colours: { rood: 'red', oranje: 'amber', geel: 'amber', groen: 'green', blauw: 'blue', paars: 'purple', grijs: 'grey' },
    money: { currency: 'EUR', scale: 1 },
    presets: {
      league: {
        title: 'Northwind Zondagcompetitie',
        subtitle: 'Eerste divisie · Stand na speelronde 18',
        footer: 'De top vier plaatst zich voor de Northwind Cup · De laatste twee degraderen',
        head: ['Pos', 'Club', 'GS', 'W', 'G', 'V', 'DV', 'DT', 'DS', 'Ptn', 'Vorm']
      },
      rates: {
        title: 'Spaarrentes',
        subtitle: 'Northwind Savings · Rentes geldig vanaf {date}',
        footer: 'Vraag in het kantoor naar de volledige voorwaarden van elke rekening',
        disclosure: 'De effectieve rente laat zien wat de rente zou zijn als de rente één keer per jaar werd uitbetaald en bijgeschreven. ' +
          'De bruto rente per jaar is de contractuele rente vóór belasting. De rentes zijn variabel, behalve bij rekeningen met een vaste looptijd, en kunnen wijzigen. ' +
          'Bij een deposito kunt u niet opnemen vóór de einddatum. Voorbeeldcijfers ter illustratie: Northwind Savings is een verzonnen naam.',
        head: ['Rekening', 'Looptijd', 'Effectieve rente', 'Bruto rente p.j.', 'Rente uitbetaald', 'Min. inleg'],
        cells: {
          'Easy Access Saver': 'Vrij opneembaar sparen',
          'Bonus Saver': 'Bonussparen',
          'Notice Saver 95': 'Opzegsparen 95',
          'Regular Saver': 'Periodiek sparen',
          'Fixed Rate Bond': 'Deposito',
          'Tax-free Saver': 'Belastingvrij sparen',
          'Junior Saver': 'Juniorsparen',
          'No term': 'Geen looptijd',
          '95 days\' notice': '95 dagen opzeg',
          '12 months': '12 maanden',
          '1 year': '1 jaar',
          '2 years': '2 jaar',
          '3 years': '3 jaar',
          'Monthly': 'Maandelijks',
          'Annually': 'Jaarlijks',
          'At maturity': 'Op einddatum',
          '{m} a month': '{m} per maand'
        }
      },
      stock: {
        title: 'Voorraad',
        subtitle: 'Northwind Supply · Magazijn B',
        footer: 'Rood: minder dan 5 op voorraad · Oranje: minder dan 15 · Elk kwartier opnieuw geteld',
        head: ['Art.nr.', 'Product', 'Vak', 'Voorraad', 'Bestellen bij', 'Leverancier'],
        cells: {
          'Cordless drill 18V': 'Accuboormachine 18 V',
          'Impact driver 18V': 'Slagschroevendraaier 18 V',
          'Wood screws 4×40 (200)': 'Houtschroeven 4×40 (200)',
          'Wall plugs, brown (100)': 'Pluggen, bruin (100)',
          'Laser level': 'Laserwaterpas',
          'Tape measure 8 m': 'Rolmaat 8 m',
          'Safety glasses': 'Veiligheidsbril',
          'Work gloves, size L': 'Werkhandschoenen, maat L',
          'Extension lead 10 m': 'Verlengsnoer 10 m',
          'LED work light': 'LED-werklamp',
          'Sanding discs P120 (50)': 'Schuurschijven P120 (50)',
          'Masking tape 48 mm': 'Afplaktape 48 mm'
        }
      },
      generic: {
        title: 'Trainingen vandaag',
        subtitle: 'Northwind Leercentrum · Verdieping 2',
        footer: 'Reserveer een plek bij de receptie of op het intranet',
        head: ['Sessie', 'Trainer', 'Zaal', 'Begin', 'Einde', 'Vrije plekken'],
        cells: {
          'Fire safety induction': 'Introductie brandveiligheid',
          'Excel: pivot tables': 'Excel: draaitabellen',
          'First aid refresher': 'Herhaling EHBO',
          'Leading hybrid teams': 'Hybride teams leiden',
          'Customer conversations': 'Klantgesprekken',
          'Data protection basics': 'Basis gegevensbescherming',
          'Presenting with confidence': 'Zelfverzekerd presenteren',
          'Excel: dashboards': 'Excel: dashboards',
          'Wellbeing at work': 'Welzijn op het werk',
          'Room 2.01': 'Zaal 2.01',
          'Room 2.04': 'Zaal 2.04',
          'Room 2.06': 'Zaal 2.06',
          'Lab 2.10': 'Lab 2.10'
        }
      }
    }
  },

  pt: {
    words: {
      updated: 'Atualizado',
      limit: 'Primeiras {shown} de {total} linhas',
      column: 'Coluna {n}'
    },
    form: { w: 'V', d: 'E', l: 'D' },
    formHead: ['forma', 'últimos'],
    lead: ['pts', 'pontos', 'total'],
    colours: { vermelho: 'red', laranja: 'amber', amarelo: 'amber', verde: 'green', azul: 'blue', roxo: 'purple', cinza: 'grey' },
    money: { currency: 'BRL', scale: 1 },
    presets: {
      league: {
        title: 'Liga de Domingo Northwind',
        subtitle: 'Primeira Divisão · Classificação após a 18ª rodada',
        footer: 'Os quatro primeiros vão à Copa Northwind · Os dois últimos são rebaixados',
        head: ['Pos', 'Time', 'J', 'V', 'E', 'D', 'GP', 'GC', 'SG', 'Pts', 'Forma']
      },
      rates: {
        title: 'Taxas de poupança',
        subtitle: 'Northwind Savings · Taxas válidas a partir de {date}',
        footer: 'Consulte na agência as condições completas de cada conta',
        disclosure: 'A taxa efetiva mostra qual seria a taxa de juros se os juros fossem pagos e capitalizados uma vez por ano. ' +
          'A taxa bruta a.a. é a taxa contratual antes dos impostos. As taxas são variáveis, exceto em contas com prazo fixo, e podem mudar. ' +
          'Depósitos a prazo não permitem saques antes do vencimento. Valores apenas ilustrativos: Northwind Savings é um nome fictício.',
        head: ['Conta', 'Prazo', 'Taxa efetiva', 'Taxa bruta a.a.', 'Pagamento de juros', 'Depósito mín.'],
        cells: {
          'Easy Access Saver': 'Poupança livre',
          'Bonus Saver': 'Poupança bônus',
          'Notice Saver 95': 'Poupança com aviso 95',
          'Regular Saver': 'Poupança programada',
          'Fixed Rate Bond': 'Depósito a prazo',
          'Tax-free Saver': 'Poupança isenta',
          'Junior Saver': 'Poupança júnior',
          'No term': 'Sem prazo',
          '95 days\' notice': 'Aviso de 95 dias',
          '12 months': '12 meses',
          '1 year': '1 ano',
          '2 years': '2 anos',
          '3 years': '3 anos',
          'Monthly': 'Mensal',
          'Annually': 'Anual',
          'At maturity': 'No vencimento',
          '{m} a month': '{m} por mês'
        }
      },
      stock: {
        title: 'Níveis de estoque',
        subtitle: 'Northwind Supply · Armazém B',
        footer: 'Vermelho: menos de 5 em estoque · Âmbar: menos de 15 · Recontado a cada 15 minutos',
        head: ['SKU', 'Produto', 'Local', 'Em estoque', 'Repor em', 'Fornecedor'],
        cells: {
          'Cordless drill 18V': 'Furadeira sem fio 18 V',
          'Impact driver 18V': 'Parafusadeira de impacto 18 V',
          'Wood screws 4×40 (200)': 'Parafusos para madeira 4×40 (200)',
          'Wall plugs, brown (100)': 'Buchas, marrons (100)',
          'Laser level': 'Nível a laser',
          'Tape measure 8 m': 'Trena 8 m',
          'Safety glasses': 'Óculos de proteção',
          'Work gloves, size L': 'Luvas de trabalho, tam. G',
          'Extension lead 10 m': 'Extensão elétrica 10 m',
          'LED work light': 'Refletor de trabalho LED',
          'Sanding discs P120 (50)': 'Discos de lixa P120 (50)',
          'Masking tape 48 mm': 'Fita crepe 48 mm'
        }
      },
      generic: {
        title: 'Treinamentos de hoje',
        subtitle: 'Centro de Treinamento Northwind · Andar 2',
        footer: 'Reserve um lugar na recepção ou na intranet',
        head: ['Sessão', 'Instrutor', 'Sala', 'Início', 'Fim', 'Vagas'],
        cells: {
          'Fire safety induction': 'Introdução à segurança contra incêndio',
          'Excel: pivot tables': 'Excel: tabelas dinâmicas',
          'First aid refresher': 'Reciclagem de primeiros socorros',
          'Leading hybrid teams': 'Liderar equipes híbridas',
          'Customer conversations': 'Conversas com clientes',
          'Data protection basics': 'Noções de proteção de dados',
          'Presenting with confidence': 'Apresentar com confiança',
          'Excel: dashboards': 'Excel: painéis',
          'Wellbeing at work': 'Bem-estar no trabalho',
          'Room 2.01': 'Sala 2.01',
          'Room 2.04': 'Sala 2.04',
          'Room 2.06': 'Sala 2.06',
          'Lab 2.10': 'Lab 2.10'
        }
      }
    }
  },

  zh: {
    words: {
      updated: '更新于',
      limit: '共{total}行，显示前{shown}行',
      column: '第{n}列'
    },
    form: { w: '胜', d: '平', l: '负' },
    formHead: ['近况', '近期战绩'],
    lead: ['积分', '总分', '合计', '得分'],
    colours: { '红': 'red', '红色': 'red', '黄': 'amber', '黄色': 'amber', '橙': 'amber', '橙色': 'amber', '绿': 'green', '绿色': 'green', '蓝': 'blue', '蓝色': 'blue', '紫': 'purple', '紫色': 'purple', '灰': 'grey', '灰色': 'grey' },
    money: { currency: 'CNY', scale: 10 },
    presets: {
      league: {
        title: 'Northwind 周日联赛',
        subtitle: '甲级 · 第18轮后积分榜',
        footer: '前四名晋级 Northwind 杯 · 最后两名降级',
        head: ['排名', '球队', '场次', '胜', '平', '负', '进球', '失球', '净胜球', '积分', '近况']
      },
      rates: {
        title: '储蓄利率',
        subtitle: 'Northwind Savings · 自{date}起执行',
        footer: '各账户的完整条款请到网点咨询',
        disclosure: '实际年利率表示利息每年支付并计入本金一次时的利率。' +
          '名义年利率是税前的合同利率。除定期账户外，利率均为浮动利率，可能调整。' +
          '定期存款到期前不可支取。数据仅为示例：Northwind Savings 是虚构名称。',
        head: ['账户', '期限', '实际年利率', '名义年利率', '付息方式', '起存金额'],
        cells: {
          'Easy Access Saver': '活期储蓄',
          'Bonus Saver': '奖励储蓄',
          'Notice Saver 95': '通知存款 95',
          'Regular Saver': '零存整取',
          'Fixed Rate Bond': '定期存款',
          'Tax-free Saver': '免税储蓄',
          'Junior Saver': '少儿储蓄',
          'No term': '无期限',
          '95 days\' notice': '提前95天通知',
          '12 months': '12个月',
          '1 year': '1年',
          '2 years': '2年',
          '3 years': '3年',
          'Monthly': '按月',
          'Annually': '按年',
          'At maturity': '到期一次付',
          '{m} a month': '每月{m}'
        }
      },
      stock: {
        title: '库存水平',
        subtitle: 'Northwind Supply · B仓库',
        footer: '红色：库存少于5 · 黄色：少于15 · 每15分钟重新盘点',
        head: ['货号', '产品', '货位', '库存', '补货点', '供应商'],
        cells: {
          'Cordless drill 18V': '无线电钻 18V',
          'Impact driver 18V': '冲击起子 18V',
          'Wood screws 4×40 (200)': '木螺钉 4×40（200个）',
          'Wall plugs, brown (100)': '膨胀管，棕色（100个）',
          'Laser level': '激光水平仪',
          'Tape measure 8 m': '卷尺 8米',
          'Safety glasses': '护目镜',
          'Work gloves, size L': '劳保手套，L码',
          'Extension lead 10 m': '延长线 10米',
          'LED work light': 'LED工作灯',
          'Sanding discs P120 (50)': '砂纸片 P120（50片）',
          'Masking tape 48 mm': '美纹纸胶带 48毫米'
        }
      },
      generic: {
        title: '今日培训',
        subtitle: 'Northwind 学习中心 · 2楼',
        footer: '请在前台或内网预约座位',
        head: ['课程', '讲师', '教室', '开始', '结束', '剩余座位'],
        cells: {
          'Fire safety induction': '消防安全入门',
          'Excel: pivot tables': 'Excel：数据透视表',
          'First aid refresher': '急救知识复习',
          'Leading hybrid teams': '带领混合办公团队',
          'Customer conversations': '与客户沟通',
          'Data protection basics': '数据保护基础',
          'Presenting with confidence': '自信地演讲',
          'Excel: dashboards': 'Excel：仪表板',
          'Wellbeing at work': '职场身心健康',
          'Room 2.01': '2.01教室',
          'Room 2.04': '2.04教室',
          'Room 2.06': '2.06教室',
          'Lab 2.10': '2.10机房'
        }
      }
    }
  }
};
