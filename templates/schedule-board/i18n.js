/* Schedule board — ScreenTinker community template. MIT.
   The board's own words in other languages. English lives in presets.js and is the fallback for any
   word missing here. The language is the template's "locale" setting (empty = the screen's
   language), picked by its primary subtag: de-CH uses de, pt-PT uses pt.

   words: per language, the preset wording. `common` applies to every preset, a preset's own entry
   wins. {time} and {day} are filled in by app.js ({day} = "tomorrow", a weekday or a short date).

   terms: the sample schedules (shown until the operator types or connects their own), one English
   phrase per line with its translations in the order of `langs`. "{n}" stands for a number or a
   letter ("Room {n}" covers Room 7 and Room 12); "preset:Phrase" is a preset-only wording. Names of
   people and places that are fictional brands (Northwind …) are not translated. */
(function () {
  'use strict';

  window.SCHEDULE_I18N = {
    langs: ['de', 'es', 'fr', 'hi', 'it', 'ja', 'nl', 'pt', 'zh'],

    words: {
      de: {
        common: { then: 'Danach', ends: 'Endet in', starts: 'Beginnt in', sep: ', ' },
        school: {
          heading: 'Stundenplan',
          orgSub: 'Klasse 9P',
          now: 'Jetzt',
          next: 'Als Nächstes',
          offToday: 'Unterricht ab {time}',
          offLater: 'Unterricht ab {day}, {time}',
          empty: 'Diese Woche kein Unterricht'
        },
        gym: {
          heading: 'Kursplan',
          orgSub: 'Gruppentraining',
          now: 'Läuft gerade',
          next: 'Nächster Kurs',
          offToday: 'Erster Kurs um {time}',
          offLater: 'Nächster Kurs: {day}, {time}',
          empty: 'Diese Woche keine Kurse'
        },
        factory: {
          heading: 'Schichtplan',
          orgSub: 'Montage · Linien A–C',
          now: 'Jetzt',
          next: 'Als Nächstes',
          offToday: 'Nächste Schicht ab {time}',
          offLater: 'Nächste Schicht: {day}, {time}',
          empty: 'Diese Woche keine Schichten'
        },
        worship: {
          heading: 'Gottesdienste',
          orgSub: 'Alle sind willkommen',
          now: 'Jetzt',
          next: 'Demnächst',
          offToday: 'Heute um {time} – herzlich willkommen',
          offLater: 'Nächster Gottesdienst: {day}, {time}',
          empty: 'Diese Woche ist nichts geplant'
        }
      },
      es: {
        common: { then: 'Después', ends: 'Termina en', starts: 'Empieza en', sep: ', ' },
        school: {
          heading: 'Horario escolar',
          orgSub: 'Grupo 9P',
          now: 'Ahora',
          next: 'A continuación',
          offToday: 'Las clases empiezan a las {time}',
          offLater: 'Próximas clases: {day}, {time}',
          empty: 'No hay clases esta semana'
        },
        gym: {
          heading: 'Horario de clases',
          orgSub: 'Clases colectivas',
          now: 'En curso',
          next: 'Próxima clase',
          offToday: 'Primera clase a las {time}',
          offLater: 'Próxima clase: {day}, {time}',
          empty: 'No hay clases esta semana'
        },
        factory: {
          heading: 'Plan de turnos',
          orgSub: 'Montaje · Líneas A–C',
          now: 'Ahora',
          next: 'A continuación',
          offToday: 'El próximo turno empieza a las {time}',
          offLater: 'Próximo turno: {day}, {time}',
          empty: 'No hay turnos esta semana'
        },
        worship: {
          heading: 'Horarios de culto',
          orgSub: 'Todos son bienvenidos',
          now: 'Ahora',
          next: 'Próximamente',
          offToday: 'Te esperamos hoy a las {time}',
          offLater: 'Próxima celebración: {day}, {time}',
          empty: 'Nada programado esta semana'
        }
      },
      fr: {
        common: { then: 'Puis', ends: 'Se termine dans', starts: 'Commence dans', sep: ', ' },
        school: {
          heading: 'Horaires des cours',
          orgSub: 'Classe 9P',
          now: 'En cours',
          next: 'À suivre',
          offToday: 'Les cours commencent à {time}',
          offLater: 'Reprise des cours : {day}, {time}',
          empty: 'Pas de cours cette semaine'
        },
        gym: {
          heading: 'Planning des cours',
          orgSub: 'Cours collectifs',
          now: 'En ce moment',
          next: 'Prochain cours',
          offToday: 'Premier cours à {time}',
          offLater: 'Prochain cours : {day}, {time}',
          empty: 'Aucun cours cette semaine'
        },
        factory: {
          heading: 'Planning des postes',
          orgSub: 'Assemblage · Lignes A–C',
          now: 'En cours',
          next: 'À suivre',
          offToday: 'Prochain poste à {time}',
          offLater: 'Prochain poste : {day}, {time}',
          empty: 'Aucun poste cette semaine'
        },
        worship: {
          heading: 'Horaires des célébrations',
          orgSub: 'Bienvenue à tous',
          now: 'En ce moment',
          next: 'Prochainement',
          offToday: 'Rejoignez-nous aujourd’hui à {time}',
          offLater: 'Prochaine célébration : {day}, {time}',
          empty: 'Rien de prévu cette semaine'
        }
      },
      hi: {
        common: { then: 'उसके बाद', ends: 'समाप्त होने में', starts: 'शुरू होने में', sep: ', ' },
        school: {
          heading: 'स्कूल समय-सारणी',
          orgSub: 'कक्षा 9P',
          now: 'अभी',
          next: 'अगला',
          offToday: 'स्कूल शुरू: {time}',
          offLater: 'स्कूल शुरू: {day}, {time}',
          empty: 'इस सप्ताह कोई कक्षा नहीं'
        },
        gym: {
          heading: 'क्लास समय-सारणी',
          orgSub: 'ग्रुप एक्सरसाइज़',
          now: 'अभी चल रहा है',
          next: 'अगली क्लास',
          offToday: 'पहली क्लास: {time}',
          offLater: 'अगली क्लास: {day}, {time}',
          empty: 'इस सप्ताह कोई क्लास नहीं'
        },
        factory: {
          heading: 'शिफ़्ट योजना',
          orgSub: 'असेंबली · लाइन A–C',
          now: 'अभी',
          next: 'अगला',
          offToday: 'अगली शिफ़्ट: {time}',
          offLater: 'अगली शिफ़्ट: {day}, {time}',
          empty: 'इस सप्ताह कोई शिफ़्ट नहीं'
        },
        worship: {
          heading: 'प्रार्थना सभा का समय',
          orgSub: 'सभी का स्वागत है',
          now: 'अभी चल रहा है',
          next: 'आगामी',
          offToday: 'आज {time} पर आप आमंत्रित हैं',
          offLater: 'अगली सभा: {day}, {time}',
          empty: 'इस सप्ताह कुछ निर्धारित नहीं'
        }
      },
      it: {
        common: { then: 'Poi', ends: 'Finisce tra', starts: 'Inizia tra', sep: ', ' },
        school: {
          heading: 'Orario scolastico',
          orgSub: 'Classe 9P',
          now: 'Adesso',
          next: 'A seguire',
          offToday: 'Le lezioni iniziano alle {time}',
          offLater: 'Prossime lezioni: {day}, {time}',
          empty: 'Nessuna lezione questa settimana'
        },
        gym: {
          heading: 'Orario dei corsi',
          orgSub: 'Corsi di gruppo',
          now: 'In corso',
          next: 'Prossimo corso',
          offToday: 'Primo corso alle {time}',
          offLater: 'Prossimo corso: {day}, {time}',
          empty: 'Nessun corso questa settimana'
        },
        factory: {
          heading: 'Piano turni',
          orgSub: 'Montaggio · Linee A–C',
          now: 'Adesso',
          next: 'A seguire',
          offToday: 'Il prossimo turno inizia alle {time}',
          offLater: 'Prossimo turno: {day}, {time}',
          empty: 'Nessun turno questa settimana'
        },
        worship: {
          heading: 'Orari delle celebrazioni',
          orgSub: 'Tutti sono benvenuti',
          now: 'In corso',
          next: 'Prossimamente',
          offToday: 'Vi aspettiamo oggi alle {time}',
          offLater: 'Prossima celebrazione: {day}, {time}',
          empty: 'Nessun appuntamento questa settimana'
        }
      },
      ja: {
        common: { then: 'その後', ends: '終了まで', starts: '開始まで', sep: ' ' },
        school: {
          heading: '時間割',
          orgSub: '9年P組',
          now: '現在',
          next: '次',
          offToday: '授業は{time}から',
          offLater: '授業は{day} {time}から',
          empty: '今週の授業はありません'
        },
        gym: {
          heading: 'クラススケジュール',
          orgSub: 'グループレッスン',
          now: '開催中',
          next: '次のクラス',
          offToday: '最初のクラスは{time}から',
          offLater: '次のクラスは{day} {time}から',
          empty: '今週のクラスはありません'
        },
        factory: {
          heading: 'シフト表',
          orgSub: '組立 · A–Cライン',
          now: '現在',
          next: '次',
          offToday: '次のシフトは{time}から',
          offLater: '次のシフトは{day} {time}から',
          empty: '今週のシフトはありません'
        },
        worship: {
          heading: '礼拝の時間',
          orgSub: 'どなたでも歓迎します',
          now: '現在',
          next: 'この後',
          offToday: '本日{time}からお待ちしています',
          offLater: '次回は{day} {time}から',
          empty: '今週の予定はありません'
        }
      },
      nl: {
        common: { then: 'Daarna', ends: 'Eindigt over', starts: 'Begint over', sep: ', ' },
        school: {
          heading: 'Lesrooster',
          orgSub: 'Klas 9P',
          now: 'Nu',
          next: 'Hierna',
          offToday: 'De lessen beginnen om {time}',
          offLater: 'Lessen beginnen: {day}, {time}',
          empty: 'Deze week geen lessen'
        },
        gym: {
          heading: 'Rooster groepslessen',
          orgSub: 'Groepslessen',
          now: 'Nu bezig',
          next: 'Volgende les',
          offToday: 'Eerste les om {time}',
          offLater: 'Volgende les: {day}, {time}',
          empty: 'Deze week geen lessen'
        },
        factory: {
          heading: 'Ploegenrooster',
          orgSub: 'Assemblage · Lijnen A–C',
          now: 'Nu',
          next: 'Hierna',
          offToday: 'Volgende dienst begint om {time}',
          offLater: 'Volgende dienst: {day}, {time}',
          empty: 'Deze week geen diensten'
        },
        worship: {
          heading: 'Kerkdiensten',
          orgSub: 'Iedereen is welkom',
          now: 'Nu bezig',
          next: 'Binnenkort',
          offToday: 'Welkom vandaag om {time}',
          offLater: 'Volgende dienst: {day}, {time}',
          empty: 'Deze week niets gepland'
        }
      },
      pt: {
        common: { then: 'Depois', ends: 'Termina em', starts: 'Começa em', sep: ', ' },
        school: {
          heading: 'Horário das aulas',
          orgSub: 'Turma 9P',
          now: 'Agora',
          next: 'A seguir',
          offToday: 'As aulas começam às {time}',
          offLater: 'Próximas aulas: {day}, {time}',
          empty: 'Sem aulas nesta semana'
        },
        gym: {
          heading: 'Grade de aulas',
          orgSub: 'Aulas coletivas',
          now: 'Acontecendo agora',
          next: 'Próxima aula',
          offToday: 'Primeira aula às {time}',
          offLater: 'Próxima aula: {day}, {time}',
          empty: 'Sem aulas nesta semana'
        },
        factory: {
          heading: 'Escala de turnos',
          orgSub: 'Montagem · Linhas A–C',
          now: 'Agora',
          next: 'A seguir',
          offToday: 'O próximo turno começa às {time}',
          offLater: 'Próximo turno: {day}, {time}',
          empty: 'Sem turnos nesta semana'
        },
        worship: {
          heading: 'Horários dos cultos',
          orgSub: 'Todos são bem-vindos',
          now: 'Acontecendo agora',
          next: 'Em breve',
          offToday: 'Venha hoje às {time}',
          offLater: 'Próximo culto: {day}, {time}',
          empty: 'Nada programado nesta semana'
        }
      },
      zh: {
        common: { then: '之后', ends: '距结束', starts: '距开始', sep: ' ' },
        school: {
          heading: '作息时间表',
          orgSub: '9P 班',
          now: '当前',
          next: '下一节',
          offToday: '{time} 开始上课',
          offLater: '{day} {time} 开始上课',
          empty: '本周没有课程'
        },
        gym: {
          heading: '课程表',
          orgSub: '团体课',
          now: '正在进行',
          next: '下一节课',
          offToday: '首节课 {time} 开始',
          offLater: '下一节课：{day} {time}',
          empty: '本周没有课程'
        },
        factory: {
          heading: '排班表',
          orgSub: '装配 · A–C 线',
          now: '当前',
          next: '下一班',
          offToday: '下一班 {time} 开始',
          offLater: '下一班：{day} {time}',
          empty: '本周没有班次'
        },
        worship: {
          heading: '聚会时间',
          orgSub: '欢迎所有人',
          now: '正在进行',
          next: '即将开始',
          offToday: '今天 {time} 欢迎参加',
          offLater: '下次聚会：{day} {time}',
          empty: '本周没有安排'
        }
      }
    },

    // English phrase: [de, es, fr, hi, it, ja, nl, pt, zh]
    terms: {
      // schedule names
      'Regular day': ['Normaler Tag', 'Día normal', 'Journée normale', 'सामान्य दिन', 'Giorno normale', '通常日', 'Gewone dag', 'Dia normal', '常规日'],
      'Exam week': ['Prüfungswoche', 'Semana de exámenes', 'Semaine d’examens', 'परीक्षा सप्ताह', 'Settimana degli esami', '試験週間', 'Toetsweek', 'Semana de provas', '考试周'],
      'Weekly timetable': ['Wochenplan', 'Horario semanal', 'Planning de la semaine', 'साप्ताहिक समय-सारणी', 'Orario settimanale', '週間スケジュール', 'Weekrooster', 'Grade semanal', '每周课程表'],
      'Standard week': ['Normalwoche', 'Semana estándar', 'Semaine type', 'सामान्य सप्ताह', 'Settimana tipo', '通常週', 'Standaardweek', 'Semana padrão', '标准周'],
      'Shutdown week': ['Stillstandswoche', 'Semana de parada', 'Semaine d’arrêt', 'शटडाउन सप्ताह', 'Settimana di fermo', '計画停止週間', 'Stilstandsweek', 'Semana de parada', '停产周'],
      'This week': ['Diese Woche', 'Esta semana', 'Cette semaine', 'इस सप्ताह', 'Questa settimana', '今週', 'Deze week', 'Esta semana', '本周'],

      // school
      'Registration': ['Anwesenheit', 'Pase de lista', 'Appel', 'हाज़िरी', 'Appello', '朝のホームルーム', 'Presentie', 'Chamada', '点名'],
      'Break': ['Pause', 'Recreo', 'Récréation', 'अवकाश', 'Intervallo', '休み時間', 'Pauze', 'Recreio', '课间休息'],
      'Lunch': ['Mittagspause', 'Almuerzo', 'Déjeuner', 'लंच', 'Pranzo', '昼休み', 'Lunch', 'Almoço', '午餐'],
      'Maths': ['Mathe', 'Matemáticas', 'Maths', 'गणित', 'Matematica', '数学', 'Wiskunde', 'Matemática', '数学'],
      'English': ['Englisch', 'Inglés', 'Anglais', 'अंग्रेज़ी', 'Inglese', '英語', 'Engels', 'Inglês', '英语'],
      'Biology': ['Biologie', 'Biología', 'Biologie', 'जीव विज्ञान', 'Biologia', '生物', 'Biologie', 'Biologia', '生物'],
      'History': ['Geschichte', 'Historia', 'Histoire', 'इतिहास', 'Storia', '歴史', 'Geschiedenis', 'História', '历史'],
      'PE': ['Sport', 'Educación física', 'EPS', 'शारीरिक शिक्षा', 'Educazione fisica', '体育', 'Gym', 'Educação física', '体育'],
      'Art': ['Kunst', 'Plástica', 'Arts plastiques', 'कला', 'Arte', '美術', 'Tekenen', 'Artes', '美术'],
      'Chemistry': ['Chemie', 'Química', 'Chimie', 'रसायन विज्ञान', 'Chimica', '化学', 'Scheikunde', 'Química', '化学'],
      'French': ['Französisch', 'Francés', 'Français', 'फ़्रेंच', 'Francese', 'フランス語', 'Frans', 'Francês', '法语'],
      'Geography': ['Erdkunde', 'Geografía', 'Géographie', 'भूगोल', 'Geografia', '地理', 'Aardrijkskunde', 'Geografia', '地理'],
      'Music': ['Musik', 'Música', 'Musique', 'संगीत', 'Musica', '音楽', 'Muziek', 'Música', '音乐'],
      'Robotics club': ['Robotik-AG', 'Club de robótica', 'Club robotique', 'रोबोटिक्स क्लब', 'Club di robotica', 'ロボット部', 'Roboticaclub', 'Clube de robótica', '机器人社团'],
      'Physics': ['Physik', 'Física', 'Physique', 'भौतिकी', 'Fisica', '物理', 'Natuurkunde', 'Física', '物理'],
      'Computing': ['Informatik', 'Informática', 'Informatique', 'कंप्यूटर', 'Informatica', '情報', 'Informatica', 'Informática', '信息技术'],
      'Games': ['Sportnachmittag', 'Deportes', 'Sports collectifs', 'खेल', 'Sport di squadra', '球技', 'Sportmiddag', 'Esportes', '体育活动'],
      'Drama': ['Theater', 'Teatro', 'Théâtre', 'नाटक', 'Teatro', '演劇', 'Drama', 'Teatro', '戏剧'],
      'Religious studies': ['Religion', 'Religión', 'Culture religieuse', 'धर्म शिक्षा', 'Religione', '宗教', 'Levensbeschouwing', 'Ensino religioso', '宗教课'],
      'Form time': ['Klassenstunde', 'Tutoría', 'Vie de classe', 'कक्षा समय', 'Ora di classe', 'ホームルーム', 'Mentoruur', 'Tutoria', '班会'],
      'Exam session {n}': ['Prüfungsblock {n}', 'Examen {n}', 'Épreuve {n}', 'परीक्षा सत्र {n}', 'Sessione d’esame {n}', '試験 {n}', 'Toetsblok {n}', 'Prova {n}', '考试 {n}'],
      'Revision': ['Wiederholung', 'Repaso', 'Révisions', 'दोहराई', 'Ripasso', '復習', 'Herhaling', 'Revisão', '复习'],
      'Room {n}': ['Raum {n}', 'Aula {n}', 'Salle {n}', 'कमरा {n}', 'Aula {n}', '{n}番教室', 'Lokaal {n}', 'Sala {n}', '{n} 教室'],
      'Courtyard': ['Schulhof', 'Patio', 'Cour', 'आँगन', 'Cortile', '中庭', 'Schoolplein', 'Pátio', '操场'],
      'Dining hall': ['Mensa', 'Comedor', 'Cantine', 'भोजनालय', 'Mensa', '食堂', 'Kantine', 'Refeitório', '食堂'],
      'Lab {n}': ['Labor {n}', 'Laboratorio {n}', 'Labo {n}', 'लैब {n}', 'Laboratorio {n}', '実験室{n}', 'Lab {n}', 'Laboratório {n}', '{n} 号实验室'],
      'Sports hall': ['Turnhalle', 'Gimnasio', 'Gymnase', 'खेल हॉल', 'Palestra', '体育館', 'Sporthal', 'Ginásio', '体育馆'],
      'Studio': ['Atelier', 'Estudio', 'Atelier', 'स्टूडियो', 'Atelier', 'スタジオ', 'Atelier', 'Ateliê', '工作室'],
      'Music room': ['Musikraum', 'Aula de música', 'Salle de musique', 'संगीत कक्ष', 'Aula di musica', '音楽室', 'Muzieklokaal', 'Sala de música', '音乐教室'],
      'IT suite': ['Computerraum', 'Aula de informática', 'Salle informatique', 'कंप्यूटर लैब', 'Aula di informatica', 'コンピューター室', 'Computerlokaal', 'Sala de informática', '机房'],
      'Playing fields': ['Sportplatz', 'Campo de deportes', 'Terrain de sport', 'खेल का मैदान', 'Campo sportivo', 'グラウンド', 'Sportveld', 'Campo de esportes', '运动场'],
      'Library': ['Bibliothek', 'Biblioteca', 'Bibliothèque', 'पुस्तकालय', 'Biblioteca', '図書室', 'Bibliotheek', 'Biblioteca', '图书馆'],
      'Ms {n}': ['Frau {n}', 'Sra. {n}', 'Mme {n}', 'सुश्री {n}', 'Prof.ssa {n}', '{n}先生', 'Mevr. {n}', 'Prof.ª {n}', '{n}老师'],
      'Mrs {n}': ['Frau {n}', 'Sra. {n}', 'Mme {n}', 'श्रीमती {n}', 'Prof.ssa {n}', '{n}先生', 'Mevr. {n}', 'Prof.ª {n}', '{n}老师'],
      'Mme {n}': ['Frau {n}', 'Sra. {n}', 'Mme {n}', 'सुश्री {n}', 'Prof.ssa {n}', '{n}先生', 'Mevr. {n}', 'Prof.ª {n}', '{n}老师'],
      'Mr {n}': ['Herr {n}', 'Sr. {n}', 'M. {n}', 'श्री {n}', 'Prof. {n}', '{n}先生', 'Dhr. {n}', 'Prof. {n}', '{n}老师'],
      'Dr {n}': ['Dr. {n}', 'Dr. {n}', 'Dr {n}', 'डॉ. {n}', 'Dott. {n}', '{n}先生', 'Dr. {n}', 'Dr. {n}', '{n}博士'],
      'Invigilators': ['Aufsicht', 'Vigilantes', 'Surveillants', 'निरीक्षक', 'Sorveglianti', '試験監督', 'Surveillanten', 'Fiscais', '监考老师'],

      // gym
      'Sunrise HIIT': ['Morgen-HIIT', 'HIIT al amanecer', 'HIIT du matin', 'सुबह का HIIT', 'HIIT all’alba', '早朝HIIT', 'Ochtend-HIIT', 'HIIT matinal', '晨间 HIIT'],
      'Mat Pilates': ['Matten-Pilates', 'Pilates en esterilla', 'Pilates au sol', 'मैट पिलेट्स', 'Pilates su tappetino', 'マットピラティス', 'Matpilates', 'Pilates de solo', '垫上普拉提'],
      'Vinyasa Flow': ['Vinyasa Flow', 'Vinyasa Flow', 'Vinyasa Flow', 'विन्यास फ़्लो', 'Vinyasa Flow', 'ヴィンヤサフロー', 'Vinyasa Flow', 'Vinyasa Flow', '流瑜伽'],
      'Spin {n}': ['Spinning {n}', 'Spinning {n}', 'Spinning {n}', 'स्पिन {n}', 'Spinning {n}', 'スピン{n}', 'Spinning {n}', 'Spinning {n}', '动感单车 {n}'],
      'Aqua Fit': ['Aquafitness', 'Aquagym', 'Aquagym', 'एक्वा फ़िट', 'Acquagym', 'アクアフィット', 'Aquafit', 'Hidroginástica', '水中健身'],
      'Lunchtime Core': ['Mittags-Core', 'Core al mediodía', 'Abdos du midi', 'लंचटाइम कोर', 'Core in pausa pranzo', 'ランチタイム体幹', 'Lunch-core', 'Core no almoço', '午间核心训练'],
      'Body Pump': ['Body Pump', 'Body Pump', 'Body Pump', 'बॉडी पंप', 'Body Pump', 'ボディパンプ', 'Body Pump', 'Body Pump', '杠铃操'],
      'Boxing Fundamentals': ['Boxen für Einsteiger', 'Boxeo básico', 'Boxe : les bases', 'बॉक्सिंग की बुनियाद', 'Boxe per principianti', 'ボクシング入門', 'Boksen basis', 'Boxe para iniciantes', '拳击入门'],
      'Yin Yoga': ['Yin Yoga', 'Yin yoga', 'Yin yoga', 'यिन योग', 'Yin yoga', '陰ヨガ', 'Yin yoga', 'Yin yoga', '阴瑜伽'],
      'Friday Spin Party': ['Freitags-Spinning-Party', 'Fiesta spinning del viernes', 'Spinning party du vendredi', 'फ़्राइडे स्पिन पार्टी', 'Spinning party del venerdì', '金曜スピンパーティー', 'Vrijdag-spinningparty', 'Festa do spinning de sexta', '周五单车派对'],
      'Saturday Bootcamp': ['Samstags-Bootcamp', 'Bootcamp del sábado', 'Bootcamp du samedi', 'शनिवार बूटकैंप', 'Bootcamp del sabato', '土曜ブートキャンプ', 'Zaterdag-bootcamp', 'Bootcamp de sábado', '周六训练营'],
      'Family Swim': ['Familienschwimmen', 'Natación en familia', 'Baignade en famille', 'पारिवारिक तैराकी', 'Nuoto in famiglia', 'ファミリースイム', 'Familiezwemmen', 'Natação em família', '家庭游泳'],
      'Strength Club': ['Kraft-Club', 'Club de fuerza', 'Club muscu', 'स्ट्रेंथ क्लब', 'Club della forza', '筋トレクラブ', 'Krachtclub', 'Clube de força', '力量俱乐部'],
      'Stretch & Restore': ['Dehnen & Entspannen', 'Estiramiento y relax', 'Étirements & détente', 'स्ट्रेच और रिलैक्स', 'Stretching e recupero', 'ストレッチ&リカバリー', 'Stretchen & ontspannen', 'Alongamento e relaxamento', '拉伸与放松'],
      'Studio {n}': ['Studio {n}', 'Sala {n}', 'Studio {n}', 'स्टूडियो {n}', 'Sala {n}', 'スタジオ{n}', 'Studio {n}', 'Sala {n}', '{n} 号厅'],
      'Cycle room': ['Cycling-Raum', 'Sala de ciclo', 'Salle de vélo', 'साइकिल रूम', 'Sala spinning', 'サイクルルーム', 'Spinningzaal', 'Sala de bike', '单车房'],
      'Pool': ['Schwimmbad', 'Piscina', 'Piscine', 'पूल', 'Piscina', 'プール', 'Zwembad', 'Piscina', '泳池'],
      'The ring': ['Boxring', 'El ring', 'Le ring', 'रिंग', 'Il ring', 'リング', 'De ring', 'O ringue', '拳台'],
      'Outdoor track': ['Außenbahn', 'Pista exterior', 'Piste extérieure', 'आउटडोर ट्रैक', 'Pista esterna', '屋外トラック', 'Buitenbaan', 'Pista externa', '室外跑道'],
      'Gym floor': ['Trainingsfläche', 'Sala de musculación', 'Plateau muscu', 'जिम फ़्लोर', 'Sala pesi', 'ジムフロア', 'Fitnesszaal', 'Área de musculação', '器械区'],
      'Lifeguard on duty': ['Mit Badeaufsicht', 'Socorrista presente', 'Maître-nageur présent', 'लाइफ़गार्ड मौजूद', 'Bagnino presente', '監視員常駐', 'Badmeester aanwezig', 'Salva-vidas presente', '救生员在岗'],

      // factory
      'factory:Break': ['Pause', 'Descanso', 'Pause', 'ब्रेक', 'Pausa', '休憩', 'Pauze', 'Intervalo', '休息'],
      'Early shift handover': ['Übergabe Frühschicht', 'Relevo turno de mañana', 'Relève poste du matin', 'सुबह की शिफ़्ट हैंडओवर', 'Cambio turno mattino', '早番引き継ぎ', 'Overdracht vroege dienst', 'Troca do turno da manhã', '早班交接'],
      'Early shift': ['Frühschicht', 'Turno de mañana', 'Poste du matin', 'सुबह की शिफ़्ट', 'Turno del mattino', '早番', 'Vroege dienst', 'Turno da manhã', '早班'],
      'Run {n}': ['Durchgang {n}', 'Tanda {n}', 'Série {n}', 'रन {n}', 'Ciclo {n}', 'ラン{n}', 'Run {n}', 'Etapa {n}', '第 {n} 轮'],
      'Late shift handover': ['Übergabe Spätschicht', 'Relevo turno de tarde', 'Relève poste d’après-midi', 'शाम की शिफ़्ट हैंडओवर', 'Cambio turno pomeriggio', '遅番引き継ぎ', 'Overdracht late dienst', 'Troca do turno da tarde', '晚班交接'],
      'Late shift': ['Spätschicht', 'Turno de tarde', 'Poste d’après-midi', 'शाम की शिफ़्ट', 'Turno del pomeriggio', '遅番', 'Late dienst', 'Turno da tarde', '晚班'],
      'Meal': ['Essenspause', 'Comida', 'Repas', 'भोजन', 'Pasto', '食事', 'Maaltijd', 'Refeição', '用餐'],
      'Night shift': ['Nachtschicht', 'Turno de noche', 'Poste de nuit', 'रात की शिफ़्ट', 'Turno di notte', '夜勤', 'Nachtdienst', 'Turno da noite', '夜班'],
      'Weekend overtime': ['Wochenendschicht', 'Horas extra de fin de semana', 'Heures sup. du week-end', 'वीकेंड ओवरटाइम', 'Straordinario del weekend', '休日出勤', 'Weekendoverwerk', 'Hora extra de fim de semana', '周末加班'],
      'Safety briefing': ['Sicherheitsunterweisung', 'Charla de seguridad', 'Briefing sécurité', 'सुरक्षा ब्रीफ़िंग', 'Briefing sicurezza', '安全朝礼', 'Veiligheidsbriefing', 'Reunião de segurança', '安全简报'],
      'Planned maintenance': ['Geplante Wartung', 'Mantenimiento programado', 'Maintenance planifiée', 'नियोजित रखरखाव', 'Manutenzione programmata', '計画保全', 'Gepland onderhoud', 'Manutenção programada', '计划检修'],
      'Line {n} board': ['Tafel Linie {n}', 'Pizarra línea {n}', 'Tableau ligne {n}', 'लाइन {n} बोर्ड', 'Lavagna linea {n}', '{n}ライン掲示板', 'Bord lijn {n}', 'Quadro da linha {n}', '{n} 线看板'],
      'Lines {n}': ['Linien {n}', 'Líneas {n}', 'Lignes {n}', 'लाइन {n}', 'Linee {n}', '{n}ライン', 'Lijnen {n}', 'Linhas {n}', '{n} 线'],
      'Line {n}': ['Linie {n}', 'Línea {n}', 'Ligne {n}', 'लाइन {n}', 'Linea {n}', '{n}ライン', 'Lijn {n}', 'Linha {n}', '{n} 线'],
      'Lines A & B': ['Linien A & B', 'Líneas A y B', 'Lignes A et B', 'लाइन A और B', 'Linee A e B', 'A・Bライン', 'Lijnen A en B', 'Linhas A e B', 'A、B 线'],
      'Canteen': ['Kantine', 'Comedor', 'Cantine', 'कैंटीन', 'Mensa', '食堂', 'Kantine', 'Refeitório', '食堂'],
      'Volunteers': ['Freiwillige', 'Voluntarios', 'Bénévoles', 'स्वयंसेवक', 'Volontari', 'ボランティア', 'Vrijwilligers', 'Voluntários', '志愿者'],
      'Engineering': ['Technik', 'Equipo técnico', 'Équipe technique', 'इंजीनियरिंग', 'Ufficio tecnico', '保全課', 'Technische dienst', 'Engenharia', '工程部'],

      // worship
      'Early Communion': ['Frühgottesdienst', 'Comunión de la mañana', 'Communion du matin', 'सुबह का प्रभु भोज', 'Comunione del mattino', '早朝聖餐式', 'Vroege viering', 'Santa Ceia da manhã', '早间圣餐'],
      'Morning Worship': ['Gottesdienst', 'Culto de la mañana', 'Culte du matin', 'प्रातः आराधना', 'Culto del mattino', '朝の礼拝', 'Ochtenddienst', 'Culto da manhã', '早堂崇拜'],
      'Coffee & Fellowship': ['Kirchcafé', 'Café y convivencia', 'Café & convivialité', 'कॉफ़ी और संगति', 'Caffè e fraternità', 'コーヒー&交わり', 'Koffie & ontmoeting', 'Café e comunhão', '咖啡团契'],
      'Evening Prayer': ['Abendgebet', 'Oración de la tarde', 'Prière du soir', 'संध्या प्रार्थना', 'Preghiera della sera', '夕べの祈り', 'Avondgebed', 'Oração da noite', '晚祷'],
      'Parents & Toddlers': ['Eltern-Kind-Gruppe', 'Padres y peques', 'Parents & tout-petits', 'माता-पिता और नन्हे बच्चे', 'Genitori e bimbi', '親子の会', 'Ouder-en-peuter', 'Pais e pequenos', '亲子时光'],
      'Choir rehearsal': ['Chorprobe', 'Ensayo del coro', 'Répétition de la chorale', 'गायक मंडली अभ्यास', 'Prove del coro', '聖歌隊練習', 'Koorrepetitie', 'Ensaio do coral', '诗班排练'],
      'Lunchtime Prayer': ['Mittagsgebet', 'Oración del mediodía', 'Prière de midi', 'दोपहर की प्रार्थना', 'Preghiera di mezzogiorno', '昼の祈り', 'Middaggebed', 'Oração do meio-dia', '午间祷告'],
      'Midweek Bible Study': ['Bibelkreis', 'Estudio bíblico', 'Étude biblique', 'बाइबल अध्ययन', 'Studio biblico', '聖書研究会', 'Bijbelstudie', 'Estudo bíblico', '周中查经'],
      'Community Food Pantry': ['Tafel', 'Banco de alimentos', 'Banque alimentaire', 'सामुदायिक खाद्य भंडार', 'Banco alimentare', 'フードパントリー', 'Voedselbank', 'Banco de alimentos', '社区食物站'],
      'Youth Night': ['Jugendabend', 'Noche de jóvenes', 'Soirée jeunes', 'युवा संध्या', 'Serata giovani', 'ユースナイト', 'Jongerenavond', 'Noite dos jovens', '青年之夜'],
      'Saturday Evening Service': ['Samstagabend-Gottesdienst', 'Culto del sábado tarde', 'Culte du samedi soir', 'शनिवार संध्या सभा', 'Culto del sabato sera', '土曜夕礼拝', 'Zaterdagavonddienst', 'Culto de sábado à noite', '周六晚崇拜'],
      'Chapel': ['Kapelle', 'Capilla', 'Chapelle', 'चैपल', 'Cappella', 'チャペル', 'Kapel', 'Capela', '小礼拜堂'],
      'Main sanctuary': ['Kirchenschiff', 'Templo', 'Nef', 'मुख्य सभागार', 'Navata', '礼拝堂', 'Kerkzaal', 'Templo', '主堂'],
      'Church hall': ['Gemeindesaal', 'Salón parroquial', 'Salle paroissiale', 'चर्च हॉल', 'Salone parrocchiale', '教会ホール', 'Zaal', 'Salão da igreja', '副堂'],
      'Youth room': ['Jugendraum', 'Sala de jóvenes', 'Salle des jeunes', 'युवा कक्ष', 'Sala giovani', 'ユースルーム', 'Jeugdruimte', 'Sala dos jovens', '青年室'],
      'Rev. {n}': ['Pfarrerin {n}', 'Rvda. {n}', 'Pasteure {n}', 'रेव. {n}', 'Rev.da {n}', '{n}牧師', 'Ds. {n}', 'Rev.ª {n}', '{n}牧师'],
      'Pastor {n}': ['Pastor {n}', 'Pastor {n}', 'Pasteur {n}', 'पास्टर {n}', 'Pastore {n}', '{n}牧師', 'Pastor {n}', 'Pastor {n}', '{n}牧师'],
      'Elder {n}': ['Ältester {n}', 'Anciano {n}', 'Ancien {n}', 'एल्डर {n}', 'Anziano {n}', '{n}長老', 'Ouderling {n}', 'Presbítero {n}', '{n}长老']
    }
  };
})();
