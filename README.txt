PROTOTIPO PALEIDIMAS (BIN KATALOGAS)


1. BENDRA INFORMACIJA

Šiame kataloge pateikiamas veikiantis sistemos prototipas ir instrukcijos,
kaip jį paleisti recenzento ar kito naudotojo aplinkoje.

Prototipas skirtas sistemos funkcionalumui pademonstruoti, o ne produkciniam
naudojimui. Visi duomenys yra testiniai.


2. PROTOTIPO PALEIDIMO BŪDAI

Sistema gali būti paleista dviem būdais:

1) Naudojant automatinius skriptus
2) Rankiniu būdu, be skriptų


3. PALEIDIMAS NAUDOJANT AUTOMATINIUS SKRIPTUS

Jeigu norite paleisti sistemą naudojant paruoštus automatinius skriptus,
skaitykite šį failą:

Paleidimas_SU_skriptais.txt

Šiame faile aprašyta:
- kokie reikalavimai sistemai
- kaip paleisti pagrindinį skriptą
- ką tiksliai daro kiekvienas skriptas


4. PALEIDIMAS RANKINIU BŪDU

Jeigu nenorite naudoti automatinių skriptų ir pageidaujate paleisti sistemą
rankiniu būdu, skaitykite šį failą:

Paleidimas_BE_skriptu.txt

Šiame faile aprašyta:
- kokias programas reikia įdiegti
- kaip rankiniu būdu paleisti backend ir frontend
- kaip atlikti migracijas ir pradinius duomenis (seed)


5. PRISIJUNGIMO DUOMENYS

Po sėkmingo sistemos paleidimo yra sukurta testinė administratoriaus paskyra:

El. paštas: admin@gmail.com  
Slaptažodis: admin


6. NAUDOJAMI NUOTOLINIAI RESURSAI

Šioje sistemoje naudojami keli nuotoliniai (išoriniai) resursai ir paslaugos, kurie leidžia išplėsti sistemos funkcionalumą ir integruoti trečiųjų šalių sprendimus. Šiame skyriuje pateikiamas naudojamų nuotolinių resursų aprašas bei trumpa informacija apie jų konfigūraciją ir prisijungimo galimybes.

6.1. Stripe API (mokėjimų sistema)

Sistemoje naudojama Stripe API, skirta mokėjimų ir prenumeratų funkcionalumui realizuoti. Stripe pasirinkta dėl plataus funkcionalumo, patikimumo ir geros dokumentacijos, leidžiančios saugiai integruoti mokėjimų sprendimus.

Mokėjimų funkcionalumas sistemoje veikia Stripe testavimo (sandbox) režimu, todėl realūs finansiniai pervedimai nėra vykdomi. Tai leidžia testuoti mokėjimų srautus ir sistemos logiką be rizikos.

Prisijungimo galimybės ir konfigūracija:
• Stripe paskyra sukuriama Stripe oficialioje svetainėje.
• Stripe valdymo skydelyje (Dashboard) sugeneruojami testavimo API raktai (public ir secret).
• Sugeneruoti API raktai pateikiami per .env failus mokėjimų mikroservise.
• Stripe API naudojama tik serverio pusėje, užtikrinant, kad slapti raktai nebūtų pasiekiami kliento pusei.

6.2. Google OAuth 2.0 (išorinis tapatybės teikėjas)

Sistemoje numatyta galimybė naudoti Google OAuth 2.0 kaip išorinį tapatybės teikėją, leidžiantį naudotojams autentifikuotis naudojant Google paskyrą. Šis funkcionalumas buvo įgyvendintas kaip dalinis sprendimas – parengta autentifikavimo architektūra integracijai su Google OAuth, tačiau pilnas funkcionalumas šiame sistemos kūrimo etape nebuvo galutinai užbaigtas.

Prisijungimo galimybės ir konfigūracija:
• OAuth kredencialai kuriami Google Cloud Console aplinkoje.
• Sukuriamas OAuth 2.0 klientas, kuriam sugeneruojami CLIENT_ID ir CLIENT_SECRET.
• Nustatomi leidžiami peradresavimo (redirect) URL, atitinkantys sistemos autentifikacijos maršrutus.
• Sugeneruoti raktai pateikiami per .env failus ir naudojami serverio pusėje.

Toks sprendimas leidžia ateityje pilnai aktyvuoti socialinio prisijungimo funkcionalumą be reikšmingų architektūrinių pakeitimų.

6.3. Pratimų vizualizacijos (GIF vaizdai)

Sistemoje naudojamos pratimų vizualizacijos animuotų GIF vaizdų pavidalu, skirtos aiškesniam pratimų atlikimo pavaizdavimui naudotojams.

Duomenų šaltinis ir naudojimas:
• Pratimų GIF vaizdai talpinami atskirame viešame GitHub repozitorijoje.
• Sistemoje saugomi tik vieši URL adresai, nurodantys į šiuos vaizdus.
• GIF failai lokaliai sistemos serveryje ar duomenų bazėje nėra saugomi.

Toks sprendimas sumažina sistemos serverio apkrovą ir leidžia efektyviai naudoti statinius resursus.

6.4. Duomenų bazės infrastruktūra

Sistemos duomenų bazė veikia lokaliai, naudojant Docker konteinerius, tačiau duomenų bazės infrastruktūra suprojektuota taip, kad galėtų būti lengvai perkelta į nuotolinę ar debesijos aplinką.

Duomenų bazės struktūra sukuriama automatiškai vykdant migracijas sistemos paleidimo metu. Prisijungimo duomenys (host, port, vartotojas, slaptažodis) valdomi per .env failus, todėl papildomų rankinių prisijungimo veiksmų prie išorinių duomenų bazių paslaugų šiame etape nereikia.


7. PASTABOS

- Automatiniai skriptai nėra privalomi, tačiau ženkliai supaprastina
  sistemos paleidimo procesą.
- Visi duomenys ir paskyros yra skirti tik demonstravimo tikslams.