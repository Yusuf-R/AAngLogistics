import * as Device from 'expo-device';
import * as Network from 'expo-network';
import {Shield, Users, Zap} from "lucide-react-native";

export const COLORS = {
    primary: '#4361EE',
    secondary: '#3A0CA3',
    accent: '#7209B7',
    background: '#F8F9FA',
    card: '#FFFFFF',
    text: '#212529',
    muted: '#6C757D',
    error: '#DC3545',
    success: '#28A745',
    warning: '#FFC107',
    border: '#DEE2E6',
    light: '#F8F9FA',
    dark: '#495057',
};

export const LOCATION_ICONS = {
    residential: 'home-outline',
    commercial: 'business-outline',
    office: 'briefcase-outline',
    mall: 'storefront-outline',
    hospital: 'medical-outline',
    school: 'school-outline',
    other: 'location-outline'
};

export const LOCATION_COLORS = {
    residential: '#28A745',
    commercial: '#007BFF',
    office: '#6F42C1',
    mall: '#FD7E14',
    hospital: '#DC3545',
    school: '#20C997',
    other: '#6C757D'
};

export const ROUTES = {
    // Tab Bar Routes
    HOME: '/driver/dashboard',
    PROFILE: '/driver/account/profile',
    VERIFICATION: '/driver/account/verification',
    WALLET: '/client/wallet',
    NOTIFICATIONS: '/client/notifications',
    UTILITY: '/driver/account/utility',
    SUPPORT: '/driver/account/support',
    POLICY: '/driver/account/policy',
    PAYMENT: '/driver/account/payment',
    SECURITY: '/driver/account/security',
    ANALYTICS: '/driver/account/analytics',
    LOCATION: '/driver/account/location',
}

// States and LGA data
export const stateAndLGA = {
    Abia: [
        "Aba North",
        "Aba South",
        "Arochukwu",
        "Bende",
        "Ikwuano",
        "Isiala-Ngwa North",
        "Isiala-Ngwa South",
        "Isuikwato",
        "Obi Nwa",
        "Ohafia",
        "Osisioma",
        "Ngwa",
        "Ugwunagbo",
        "Ukwa East",
        "Ukwa West",
        "Umuahia North",
        "Umuahia South",
        "Umu-Neochi"
    ],
    Adamawa: [
        "Demsa",
        "Fufore",
        "Ganaye",
        "Gireri",
        "Gombi",
        "Guyuk",
        "Hong",
        "Jada",
        "Lamurde",
        "Madagali",
        "Maiha",
        "Mayo-Belwa",
        "Michika",
        "Mubi North",
        "Mubi South",
        "Numan",
        "Shelleng",
        "Song",
        "Toungo",
        "Yola North",
        "Yola South"
    ],
    Anambra: [
        "Aguata",
        "Anambra East",
        "Anambra West",
        "Anaocha",
        "Awka North",
        "Awka South",
        "Ayamelum",
        "Dunukofia",
        "Ekwusigo",
        "Idemili North",
        "Idemili south",
        "Ihiala",
        "Njikoka",
        "Nnewi North",
        "Nnewi South",
        "Ogbaru",
        "Onitsha North",
        "Onitsha South",
        "Orumba North",
        "Orumba South",
        "Oyi"
    ],
    "Akwa-Ibom": [
        "Abak",
        "Eastern Obolo",
        "Eket",
        "Esit Eket",
        "Essien Udim",
        "Etim Ekpo",
        "Etinan",
        "Ibeno",
        "Ibesikpo Asutan",
        "Ibiono Ibom",
        "Ika",
        "Ikono",
        "Ikot Abasi",
        "Ikot Ekpene",
        "Ini",
        "Itu",
        "Mbo",
        "Mkpat Enin",
        "Nsit Atai",
        "Nsit Ibom",
        "Nsit Ubium",
        "Obot Akara",
        "Okobo",
        "Onna",
        "Oron",
        "Oruk Anam",
        "Udung Uko",
        "Ukanafun",
        "Uruan",
        "Urue-Offong/Oruko ",
        "Uyo"
    ],
    Bauchi: [
        "Alkaleri",
        "Bauchi",
        "Bogoro",
        "Damban",
        "Darazo",
        "Dass",
        "Ganjuwa",
        "Giade",
        "Itas/Gadau",
        "Jama'are",
        "Katagum",
        "Kirfi",
        "Misau",
        "Ningi",
        "Shira",
        "Tafawa-Balewa",
        "Toro",
        "Warji",
        "Zaki"
    ],
    Bayelsa: [
        "Brass",
        "Ekeremor",
        "Kolokuma/Opokuma",
        "Nembe",
        "Ogbia",
        "Sagbama",
        "Southern Jaw",
        "Yenegoa"
    ],
    Benue: [
        "Ado",
        "Agatu",
        "Apa",
        "Buruku",
        "Gboko",
        "Guma",
        "Gwer East",
        "Gwer West",
        "Katsina-Ala",
        "Konshisha",
        "Kwande",
        "Logo",
        "Makurdi",
        "Obi",
        "Ogbadibo",
        "Oju",
        "Okpokwu",
        "Ohimini",
        "Oturkpo",
        "Tarka",
        "Ukum",
        "Ushongo",
        "Vandeikya"
    ],
    Borno: [
        "Abadam",
        "Askira/Uba",
        "Bama",
        "Bayo",
        "Biu",
        "Chibok",
        "Damboa",
        "Dikwa",
        "Gubio",
        "Guzamala",
        "Gwoza",
        "Hawul",
        "Jere",
        "Kaga",
        "Kala/Balge",
        "Konduga",
        "Kukawa",
        "Kwaya Kusar",
        "Mafa",
        "Magumeri",
        "Maiduguri",
        "Marte",
        "Mobbar",
        "Monguno",
        "Ngala",
        "Nganzai",
        "Shani"
    ],
    "Cross-River": [
        "Akpabuyo",
        "Odukpani",
        "Akamkpa",
        "Biase",
        "Abi",
        "Ikom",
        "Yarkur",
        "Odubra",
        "Boki",
        "Ogoja",
        "Yala",
        "Obanliku",
        "Obudu",
        "Calabar South",
        "Etung",
        "Bekwara",
        "Bakassi",
        "Calabar Municipality"
    ],
    Delta: [
        "Oshimili",
        "Aniocha",
        "Aniocha South",
        "Ika South",
        "Ika North-East",
        "Ndokwa West",
        "Ndokwa East",
        "Isoko south",
        "Isoko North",
        "Bomadi",
        "Burutu",
        "Ughelli South",
        "Ughelli North",
        "Ethiope West",
        "Ethiope East",
        "Sapele",
        "Okpe",
        "Warri North",
        "Warri South",
        "Uvwie",
        "Udu",
        "Warri Central",
        "Ukwani",
        "Oshimili North",
        "Patani"
    ],
    Ebonyi: [
        "Edda",
        "Afikpo",
        "Onicha",
        "Ohaozara",
        "Abakaliki",
        "Ishielu",
        "lkwo",
        "Ezza",
        "Ezza South",
        "Ohaukwu",
        "Ebonyi",
        "Ivo"
    ],
    Enugu: [
        "Enugu South,",
        "Igbo-Eze South",
        "Enugu North",
        "Nkanu",
        "Udi Agwu",
        "Oji-River",
        "Ezeagu",
        "IgboEze North",
        "Isi-Uzo",
        "Nsukka",
        "Igbo-Ekiti",
        "Uzo-Uwani",
        "Enugu Eas",
        "Aninri",
        "Nkanu East",
        "Udenu."
    ],
    Edo: [
        "Esan North-East",
        "Esan Central",
        "Esan West",
        "Egor",
        "Ukpoba",
        "Central",
        "Etsako Central",
        "Igueben",
        "Oredo",
        "Ovia SouthWest",
        "Ovia South-East",
        "Orhionwon",
        "Uhunmwonde",
        "Etsako East",
        "Esan South-East"
    ],
    Ekiti: [
        "Ado",
        "Ekiti-East",
        "Ekiti-West",
        "Emure/Ise/Orun",
        "Ekiti South-West",
        "Ikere",
        "Irepodun",
        "Ijero,",
        "Ido/Osi",
        "Oye",
        "Ikole",
        "Moba",
        "Gbonyin",
        "Efon",
        "Ise/Orun",
        "Ilejemeje."
    ],
    FCT: [
        "Abaji",
        "Abuja Municipal",
        "Bwari",
        "Gwagwalada",
        "Kuje",
        "Kwali"
    ],
    Gombe: [
        "Akko",
        "Balanga",
        "Billiri",
        'Dukku',
        "Kaltungo",
        "Kwami",
        "Shomgom",
        "Funakaye",
        "Gombe",
        "Nafada/Bajoga",
        "Yamaltu/Delta."
    ],
    Imo: [
        "Aboh-Mbaise",
        "Ahiazu-Mbaise",
        "Ehime-Mbano",
        "Ezinihitte",
        "Ideato North",
        "Ideato South",
        "Ihitte/Uboma",
        "Ikeduru",
        "Isiala Mbano",
        "Isu",
        "Mbaitoli",
        "Mbaitoli",
        "Ngor-Okpala",
        "Njaba",
        "Nwangele",
        "Nkwerre",
        "Obowo",
        "Oguta",
        "Ohaji/Egbema",
        "Okigwe",
        "Orlu",
        "Orsu",
        "Oru East",
        "Oru West",
        "Owerri-Municipal",
        "Owerri North",
        "Owerri West"
    ],
    Jigawa: [
        "Auyo",
        "Babura",
        "Birni Kudu",
        "Biriniwa",
        "Buji",
        "Dutse",
        "Gagarawa",
        "Garki",
        "Gumel",
        "Guri",
        "Gwaram",
        "Gwiwa",
        "Hadejia",
        "Jahun",
        "Kafin Hausa",
        "Kaugama Kazaure",
        "Kiri Kasamma",
        "Kiyawa",
        "Maigatari",
        "Malam Madori",
        "Miga",
        "Ringim",
        "Roni",
        "Sule-Tankarkar",
        "Taura",
        "Yankwashi"
    ],
    Kaduna: [
        "Birni-Gwari",
        "Chikun",
        "Giwa",
        "Igabi",
        "Ikara",
        "jaba",
        "Jema'a",
        "Kachia",
        "Kaduna North",
        "Kaduna South",
        "Kagarko",
        "Kajuru",
        "Kaura",
        "Kauru",
        "Kubau",
        "Kudan",
        "Lere",
        "Makarfi",
        "Sabon-Gari",
        "Sanga",
        "Soba",
        "Zango-Kataf",
        "Zaria"
    ],
    Kano: [
        "Ajingi",
        "Albasu",
        "Bagwai",
        "Bebeji",
        "Bichi",
        "Bunkure",
        "Dala",
        "Dambatta",
        "Dawakin Kudu",
        "Dawakin Tofa",
        "Doguwa",
        "Fagge",
        "Gabasawa",
        "Garko",
        "Garum",
        "Mallam",
        "Gaya",
        "Gezawa",
        "Gwale",
        "Gwarzo",
        "Kabo",
        "Kano Municipal",
        "Karaye",
        "Kibiya",
        "Kiru",
        "kumbotso",
        "Ghari",
        "Kura",
        "Madobi",
        "Makoda",
        "Minjibir",
        "Nasarawa",
        "Rano",
        "Rimin Gado",
        "Rogo",
        "Shanono",
        "Sumaila",
        "Takali",
        "Tarauni",
        "Tofa",
        "Tsanyawa",
        "Tudun Wada",
        "Ungogo",
        "Warawa",
        "Wudil"
    ],
    Katsina: [
        "Bakori",
        "Batagarawa",
        "Batsari",
        "Baure",
        "Bindawa",
        "Charanchi",
        "Dandume",
        "Danja",
        "Dan Musa",
        "Daura",
        "Dutsi",
        "Dutsin-Ma",
        "Faskari",
        "Funtua",
        "Ingawa",
        "Jibia",
        "Kafur",
        "Kaita",
        "Kankara",
        "Kankia",
        "Katsina",
        "Kurfi",
        "Kusada",
        "Mai'Adua",
        "Malumfashi",
        "Mani",
        "Mashi",
        "Matazuu",
        "Musawa",
        "Rimi",
        "Sabuwa",
        "Safana",
        "Sandamu",
        "Zango"
    ],
    Kebbi: [
        "Aleiro",
        "Arewa-Dandi",
        "Argungu",
        "Augie",
        "Bagudo",
        "Birnin Kebbi",
        "Bunza",
        "Dandi",
        "Fakai",
        "Gwandu",
        "Jega",
        "Kalgo",
        "Koko/Besse",
        "Maiyama",
        "Ngaski",
        "Sakaba",
        "Shanga",
        "Suru",
        "Wasagu/Danko",
        "Yauri",
        "Zuru"
    ],
    Kogi: [
        "Adavi",
        "Ajaokuta",
        "Ankpa",
        "Bassa",
        "Dekina",
        "Ibaji",
        "Idah",
        "Igalamela-Odolu",
        "Ijumu",
        "Kabba/Bunu",
        "Kogi",
        "Lokoja",
        "Mopa-Muro",
        "Ofu",
        "Ogori/Mangongo",
        "Okehi",
        "Okene",
        "Olamabolo",
        "Omala",
        "Yagba East",
        "Yagba West"
    ],
    Kwara: [
        "Asa",
        "Baruten",
        "Edu",
        "Ekiti",
        "Ifelodun",
        "Ilorin East",
        "Ilorin West",
        "Irepodun",
        "Isin",
        "Kaiama",
        "Moro",
        "Offa",
        "Oke-Ero",
        "Oyun",
        "Pategi"
    ],
    Lagos: [
        "Agege",
        "Ajeromi-Ifelodun",
        "Alimosho",
        "Amuwo-Odofin",
        "Apapa",
        "Badagry",
        "Epe",
        "Eti-Osa",
        "Ibeju/Lekki",
        "Ifako-Ijaye",
        "Ikeja",
        "Ikorodu",
        "Kosofe",
        "Lagos Island",
        "Lagos Mainland",
        "Mushin",
        "Ojo",
        "Oshodi-Isolo",
        "Shomolu",
        "Surulere"
    ],
    Nasarawa: [
        "Akwanga",
        "Awe",
        "Doma",
        "Karu",
        "Keana",
        "Keffi",
        "Kokona",
        "Lafia",
        "Nasarawa",
        "Nasarawa-Eggon",
        "Obi",
        "Toto",
        "Wamba"
    ],
    Niger: [
        "Agaie",
        "Agwara",
        "Bida",
        "Borgu",
        "Bosso",
        "Chanchaga",
        "Edati",
        "Gbako",
        "Gurara",
        "Katcha",
        "Kontagora",
        "Lapai",
        "Lavun",
        "Magama",
        "Mariga",
        "Mashegu",
        "Mokwa",
        "Muya",
        "Pailoro",
        "Rafi",
        "Rijau",
        "Shiroro",
        "Suleja",
        "Tafa",
        "Wushishi"
    ],
    Ogun: [
        "Abeokuta North",
        "Abeokuta South",
        "Ado-Odo/Ota",
        "Yewa North",
        "Yewa South",
        "Ewekoro",
        "Ifo",
        "Ijebu East",
        "Ijebu North",
        "Ijebu North East",
        "Ijebu Ode",
        "Ikenne",
        "Imeko-Afon",
        "Ipokia",
        "Obafemi-Owode",
        "Ogun Waterside",
        "Odeda",
        "Odogbolu",
        "Remo North",
        "Shagamu"
    ],
    Ondo: [
        "Akoko North East",
        "Akoko North West",
        "Akoko South Akure East",
        "Akoko South West",
        "Akure North",
        "Akure South",
        "Ese-Odo",
        "Idanre",
        "Ifedore",
        "Ilaje",
        "Ile-Oluji",
        "Okeigbo",
        "Irele",
        "Odigbo",
        "Okitipupa",
        "Ondo East",
        "Ondo West",
        "Ose",
        "Owo"
    ],
    Osun: [
        "Aiyedade",
        "Aiyedire",
        "Atakumosa East",
        "Atakumosa West",
        "Boluwaduro",
        "Boripe",
        "Ede North",
        "Ede South",
        "Egbedore",
        "Ejigbo",
        "Ife Central",
        "Ife East",
        "Ife North",
        "Ife South",
        "Ifedayo",
        "Ifelodun",
        "Ila",
        "Ilesha East",
        "Ilesha West",
        "Irepodun",
        "Irewole",
        "Isokan",
        "Iwo",
        "Obokun",
        "Odo-Otin",
        "Ola-Oluwa",
        "Olorunda",
        "Oriade",
        "Orolu",
        "Osogbo"
    ],
    Oyo: [
        "Afijio",
        "Akinyele",
        "Atiba",
        "Atisbo",
        "Egbeda",
        "Ibadan Central",
        "Ibadan North",
        "Ibadan North West",
        "Ibadan South East",
        "Ibadan South West",
        "Ibarapa Central",
        "Ibarapa East",
        "Ibarapa North",
        "Ido",
        "Irepo",
        "Iseyin",
        "Itesiwaju",
        "Iwajowa",
        "Kajola",
        "Lagelu Ogbomosho North",
        "Ogbomosho South",
        "Ogo Oluwa",
        "Olorunsogo",
        "Oluyole",
        "Ona-Ara",
        "Orelope",
        "Ori Ire",
        "Oyo East",
        "Oyo West",
        "Saki East",
        "Saki West",
        "Surulere"
    ],
    Plateau: [
        "Barikin Ladi",
        "Bassa",
        "Bokkos",
        "Jos East",
        "Jos North",
        "Jos South",
        "Kanam",
        "Kanke",
        "Langtang North",
        "Langtang South",
        "Mangu",
        "Mikang",
        "Pankshin",
        "Qua'an Pan",
        "Riyom",
        "Shendam",
        "Wase"
    ],
    Rivers: [
        "Abua/Odual",
        "Ahoada East",
        "Ahoada West",
        "Akuku Toru",
        "Andoni",
        "Asari-Toru",
        "Bonny",
        "Degema",
        "Emohua",
        "Eleme",
        "Etche",
        "Gokana",
        "Ikwerre",
        "Khana",
        "Obio/Akpor",
        "Ogba/Egbema/Ndoni",
        "Ogu/Bolo",
        "Okrika",
        "Omumma",
        "Opobo/Nkoro",
        "Oyigbo",
        "Port-Harcourt",
        "Tai"
    ],
    Sokoto: [
        "Binji",
        "Bodinga",
        "Dange-shnsi",
        "Gada",
        "Goronyo",
        "Gudu",
        "Gawabawa",
        "Illela",
        "Isa",
        "Kware",
        "kebbe",
        "Rabah",
        "Sabon birni",
        "Shagari",
        "Silame",
        "Sokoto North",
        "Sokoto South",
        "Tambuwal",
        "Tqngaza",
        "Tureta",
        "Wamako",
        "Wurno",
        "Yabo"
    ],
    Taraba: [
        "Ardo-kola",
        "Bali",
        "Donga",
        "Gashaka",
        "Cassol",
        "Ibi",
        "Jalingo",
        "Karin-Lamido",
        "Kurmi",
        "Lau",
        "Sardauna",
        "Takum",
        "Ussa",
        "Wukari",
        "Yorro",
        "Zing"
    ],
    Yobe: [
        "Bade",
        "Bursari",
        "Damaturu",
        "Fika",
        "Fune",
        "Geidam",
        "Gujba",
        "Gulani",
        "Jakusko",
        "Karasuwa",
        "Karawa",
        "Machina",
        "Nangere",
        "Nguru Potiskum",
        "Tarmua",
        "Yunusari",
        "Yusufari"
    ],
    Zamfara: [
        "Anka",
        "Bakura",
        "Birnin Magaji",
        "Bukkuyum",
        "Bungudu",
        "Gummi",
        "Gusau",
        "Kaura",
        "Namoda",
        "Maradun",
        "Maru",
        "Shinkafi",
        "Talata Mafara",
        "Tsafe",
        "Zurmi"
    ]
}
export const NIGERIAN_BANKS = [
    {
        "name": "9mobile 9Payment Service Bank",
        "code": "120001"
    },
    {
        "name": "Abbey Mortgage Bank",
        "code": "404"
    },
    {
        "name": "Above Only MFB",
        "code": "51204"
    },
    {
        "name": "Abulesoro MFB",
        "code": "51312"
    },
    {
        "name": "Access Bank",
        "code": "044"
    },
    {
        "name": "Access Bank (Diamond)",
        "code": "063"
    },
    {
        "name": "Accion Microfinance Bank",
        "code": "602"
    },
    {
        "name": "AG Mortgage Bank",
        "code": "90077"
    },
    {
        "name": "Ahmadu Bello University Microfinance Bank",
        "code": "50036"
    },
    {
        "name": "Airtel Smartcash PSB",
        "code": "120004"
    },
    {
        "name": "AKU Microfinance Bank",
        "code": "51336"
    },
    {
        "name": "Akuchukwu Microfinance Bank Limited",
        "code": "090561"
    },
    {
        "name": "Amegy Microfinance Bank",
        "code": "090629"
    },
    {
        "name": "Amju Unique MFB",
        "code": "50926"
    },
    {
        "name": "AMPERSAND MICROFINANCE BANK",
        "code": "51341"
    },
    {
        "name": "Aramoko MFB",
        "code": "50083"
    },
    {
        "name": "ASO Savings and Loans",
        "code": "401"
    },
    {
        "name": "Astrapolaris MFB LTD",
        "code": "50094"
    },
    {
        "name": "AVUENEGBE MICROFINANCE BANK",
        "code": "090478"
    },
    {
        "name": "AWACASH MICROFINANCE BANK",
        "code": "51351"
    },
    {
        "name": "Bainescredit MFB",
        "code": "51229"
    },
    {
        "name": "Banc Corp Microfinance Bank",
        "code": "50117"
    },
    {
        "name": "Baobab Microfinance Bank",
        "code": "50992"
    },
    {
        "name": "BellBank Microfinance Bank",
        "code": "51100"
    },
    {
        "name": "Benysta Microfinance Bank Limited",
        "code": "51267"
    },
    {
        "name": "Beststar Microfinance Bank",
        "code": "50123"
    },
    {
        "name": "Bowen Microfinance Bank",
        "code": "50931"
    },
    {
        "name": "Branch International Financial Services Limited",
        "code": "40163"
    },
    {
        "name": "Carbon",
        "code": "565"
    },
    {
        "name": "Cashbridge Microfinance Bank Limited",
        "code": "51353"
    },
    {
        "name": "CASHCONNECT MFB",
        "code": "865"
    },
    {
        "name": "CEMCS Microfinance Bank",
        "code": "50823"
    },
    {
        "name": "Chanelle Microfinance Bank Limited",
        "code": "50171"
    },
    {
        "name": "Chikum Microfinance bank",
        "code": "312"
    },
    {
        "name": "Citibank Nigeria",
        "code": "023"
    },
    {
        "name": "CITYCODE MORTAGE BANK",
        "code": "070027"
    },
    {
        "name": "Consumer Microfinance Bank",
        "code": "50910"
    },
    {
        "name": "Corestep MFB",
        "code": "50204"
    },
    {
        "name": "Coronation Merchant Bank",
        "code": "559"
    },
    {
        "name": "County Finance Limited",
        "code": "40128"
    },
    {
        "name": "Crescent MFB",
        "code": "51297"
    },
    {
        "name": "Crust Microfinance Bank",
        "code": "090560"
    },
    {
        "name": "Davenport MICROFINANCE BANK",
        "code": "51334"
    },
    {
        "name": "Dot Microfinance Bank",
        "code": "50162"
    },
    {
        "name": "Ecobank Nigeria",
        "code": "050"
    },
    {
        "name": "Ekimogun MFB",
        "code": "50263"
    },
    {
        "name": "Ekondo Microfinance Bank",
        "code": "098"
    },
    {
        "name": "EXCEL FINANCE BANK",
        "code": "090678"
    },
    {
        "name": "Eyowo",
        "code": "50126"
    },
    {
        "name": "Fairmoney Microfinance Bank",
        "code": "51318"
    },
    {
        "name": "Fedeth MFB",
        "code": "50298"
    },
    {
        "name": "Fidelity Bank",
        "code": "070"
    },
    {
        "name": "Firmus MFB",
        "code": "51314"
    },
    {
        "name": "First Bank of Nigeria",
        "code": "011"
    },
    {
        "name": "First City Monument Bank",
        "code": "214"
    },
    {
        "name": "FIRST ROYAL MICROFINANCE BANK",
        "code": "090164"
    },
    {
        "name": "FirstTrust Mortgage Bank Nigeria",
        "code": "413"
    },
    {
        "name": "FLOURISH MFB",
        "code": "50315"
    },
    {
        "name": "FSDH Merchant Bank Limited",
        "code": "501"
    },
    {
        "name": "FUTMINNA MICROFINANCE BANK",
        "code": "832"
    },
    {
        "name": "Gateway Mortgage Bank LTD",
        "code": "812"
    },
    {
        "name": "Globus Bank",
        "code": "00103"
    },
    {
        "name": "Goldman MFB",
        "code": "090574"
    },
    {
        "name": "GoMoney",
        "code": "100022"
    },
    {
        "name": "GOOD SHEPHERD MICROFINANCE BANK",
        "code": "090664"
    },
    {
        "name": "Goodnews Microfinance Bank",
        "code": "50739"
    },
    {
        "name": "Greenwich Merchant Bank",
        "code": "562"
    },
    {
        "name": "Guaranty Trust Bank",
        "code": "058"
    },
    {
        "name": "Hackman Microfinance Bank",
        "code": "51251"
    },
    {
        "name": "Hasal Microfinance Bank",
        "code": "50383"
    },
    {
        "name": "HopePSB",
        "code": "120002"
    },
    {
        "name": "Ibile Microfinance Bank",
        "code": "51244"
    },
    {
        "name": "Ikoyi Osun MFB",
        "code": "50439"
    },
    {
        "name": "Ilaro Poly Microfinance Bank",
        "code": "50442"
    },
    {
        "name": "Imowo MFB",
        "code": "50453"
    },
    {
        "name": "IMPERIAL HOMES MORTAGE BANK",
        "code": "415"
    },
    {
        "name": "Infinity MFB",
        "code": "50457"
    },
    {
        "name": "Jaiz Bank",
        "code": "301"
    },
    {
        "name": "Kadpoly MFB",
        "code": "50502"
    },
    {
        "name": "KANOPOLY MFB",
        "code": "51308"
    },
    {
        "name": "Keystone Bank",
        "code": "082"
    },
    {
        "name": "KONGAPAY (Kongapay Technologies Limited)(formerly Zinternet)",
        "code": "100025"
    },
    {
        "name": "Kredi Money MFB LTD",
        "code": "50200"
    },
    {
        "name": "Kuda Bank",
        "code": "50211"
    },
    {
        "name": "Lagos Building Investment Company Plc.",
        "code": "90052"
    },
    {
        "name": "Links MFB",
        "code": "50549"
    },
    {
        "name": "Living Trust Mortgage Bank",
        "code": "031"
    },
    {
        "name": "LOMA MFB",
        "code": "50491"
    },
    {
        "name": "Lotus Bank",
        "code": "303"
    },
    {
        "name": "MAINSTREET MICROFINANCE BANK",
        "code": "090171"
    },
    {
        "name": "Mayfair MFB",
        "code": "50563"
    },
    {
        "name": "Mint MFB",
        "code": "50304"
    },
    {
        "name": "Money Master PSB",
        "code": "946"
    },
    {
        "name": "Moniepoint MFB",
        "code": "50515"
    },
    {
        "name": "MTN Momo PSB",
        "code": "120003"
    },
    {
        "name": "MUTUAL BENEFITS MICROFINANCE BANK",
        "code": "090190"
    },
    {
        "name": "NDCC MICROFINANCE BANK",
        "code": "090679"
    },
    {
        "name": "NET MICROFINANCE BANK",
        "code": "51361"
    },
    {
        "name": "Nigerian Navy Microfinance Bank Limited",
        "code": "51142"
    },
    {
        "name": "NPF MICROFINANCE BANK",
        "code": "50629"
    },
    {
        "name": "OPay Digital Services Limited (OPay)",
        "code": "999992"
    },
    {
        "name": "Optimus Bank Limited",
        "code": "107"
    },
    {
        "name": "Paga",
        "code": "100002"
    },
    {
        "name": "PalmPay",
        "code": "999991"
    },
    {
        "name": "Parallex Bank",
        "code": "104"
    },
    {
        "name": "Parkway - ReadyCash",
        "code": "311"
    },
    {
        "name": "PATHFINDER MICROFINANCE BANK LIMITED",
        "code": "090680"
    },
    {
        "name": "Paystack-Titan",
        "code": "100039"
    },
    {
        "name": "Peace Microfinance Bank",
        "code": "50743"
    },
    {
        "name": "PECANTRUST MICROFINANCE BANK LIMITED",
        "code": "51226"
    },
    {
        "name": "Personal Trust MFB",
        "code": "51146"
    },
    {
        "name": "Petra Mircofinance Bank Plc",
        "code": "50746"
    },
    {
        "name": "PFI FINANCE COMPANY LIMITED",
        "code": "050021"
    },
    {
        "name": "Platinum Mortgage Bank",
        "code": "268"
    },
    {
        "name": "Pocket App",
        "code": "00716"
    },
    {
        "name": "Polaris Bank",
        "code": "076"
    },
    {
        "name": "Polyunwana MFB",
        "code": "50864"
    },
    {
        "name": "PremiumTrust Bank",
        "code": "105"
    },
    {
        "name": "PROSPERIS FINANCE LIMITED",
        "code": "050023"
    },
    {
        "name": "Providus Bank",
        "code": "101"
    },
    {
        "name": "QuickFund MFB",
        "code": "51293"
    },
    {
        "name": "Rand Merchant Bank",
        "code": "502"
    },
    {
        "name": "RANDALPHA MICROFINANCE BANK",
        "code": "090496"
    },
    {
        "name": "Refuge Mortgage Bank",
        "code": "90067"
    },
    {
        "name": "REHOBOTH MICROFINANCE BANK",
        "code": "50761"
    },
    {
        "name": "Rephidim Microfinance Bank",
        "code": "50994"
    },
    {
        "name": "Rigo Microfinance Bank Limited",
        "code": "51286"
    },
    {
        "name": "ROCKSHIELD MICROFINANCE BANK",
        "code": "50767"
    },
    {
        "name": "Rubies MFB",
        "code": "125"
    },
    {
        "name": "Safe Haven MFB",
        "code": "51113"
    },
    {
        "name": "Safe Haven Microfinance Bank Limited",
        "code": "951113"
    },
    {
        "name": "SAGE GREY FINANCE LIMITED",
        "code": "40165"
    },
    {
        "name": "Shield MFB",
        "code": "50582"
    },
    {
        "name": "Signature Bank Ltd",
        "code": "106"
    },
    {
        "name": "Solid Allianze MFB",
        "code": "51062"
    },
    {
        "name": "Solid Rock MFB",
        "code": "50800"
    },
    {
        "name": "Sparkle Microfinance Bank",
        "code": "51310"
    },
    {
        "name": "Stanbic IBTC Bank",
        "code": "221"
    },
    {
        "name": "Standard Chartered Bank",
        "code": "068"
    },
    {
        "name": "STANFORD MICROFINANCE BANK",
        "code": "090162"
    },
    {
        "name": "STATESIDE MICROFINANCE BANK",
        "code": "50809"
    },
    {
        "name": "Stellas MFB",
        "code": "51253"
    },
    {
        "name": "Sterling Bank",
        "code": "232"
    },
    {
        "name": "Suntrust Bank",
        "code": "100"
    },
    {
        "name": "Supreme MFB",
        "code": "50968"
    },
    {
        "name": "TAJ Bank",
        "code": "302"
    },
    {
        "name": "Tangerine Money",
        "code": "51269"
    },
    {
        "name": "TCF MFB",
        "code": "51211"
    },
    {
        "name": "Titan Bank",
        "code": "102"
    },
    {
        "name": "U&C Microfinance Bank Ltd (U AND C MFB)",
        "code": "50840"
    },
    {
        "name": "Uhuru MFB",
        "code": "51322"
    },
    {
        "name": "Unaab Microfinance Bank Limited",
        "code": "50870"
    },
    {
        "name": "Unical MFB",
        "code": "50871"
    },
    {
        "name": "Unilag Microfinance Bank",
        "code": "51316"
    },
    {
        "name": "Union Bank of Nigeria",
        "code": "032"
    },
    {
        "name": "United Bank For Africa",
        "code": "033"
    },
    {
        "name": "Unity Bank",
        "code": "215"
    },
    {
        "name": "Uzondu Microfinance Bank Awka Anambra State",
        "code": "50894"
    },
    {
        "name": "Vale Finance Limited",
        "code": "050020"
    },
    {
        "name": "VFD Microfinance Bank Limited",
        "code": "566"
    },
    {
        "name": "Waya Microfinance Bank",
        "code": "51355"
    },
    {
        "name": "Wema (ALAT) Bank",
        "code": "035"
    },
    {
        "name": "Zenith Bank",
        "code": "057"
    }
]

// Terms and Conditions Constants
export const tcs = [
    {
        id: 'definitions',
        title: 'Definitions & Interpretation',
        icon: 'document-text-outline',
        content: [
            {term: 'Platform', definition: 'refers to AANG Logistics digital marketplace connecting senders with drivers.'},
            {term: 'Driver', definition: 'refers to the independent contractor providing delivery services through the Platform.'},
            {term: 'Sender', definition: 'refers to the individual or entity requesting delivery services through the Platform.'},
            {term: 'Delivery Request', definition: 'refers to a request for delivery services made by a Sender through the Platform.'},
            {term: 'Service Fee', definition: 'refers to the amount payable to the Driver for completed delivery services.'},
            {term: 'Platform Commission', definition: 'refers to the percentage of Service Fee retained by the Platform for providing the marketplace.'},
            {term: 'Active Hours', definition: 'refers to time spent by the Driver while available to accept Delivery Requests on the Platform.'},
        ]
    },
    {
        id: 'driver-status',
        title: 'Independent Contractor Status',
        icon: 'person-outline',
        content: `As a Driver on our Platform, you are an independent contractor, not an employee:`,
        body:`• You have complete control over your schedule, working hours, and acceptance of Delivery Requests
• You are responsible for your own taxes, insurance, and business expenses
• You provide your own vehicle, equipment, and tools necessary for delivery services
• You are not entitled to employee benefits, including health insurance, paid leave, or retirement benefits
• You may work for other delivery platforms or engage in other business activities
• The Platform does not direct or control the manner in which you perform delivery services`
    },
    {
        id: 'registration',
        title: 'Driver Registration & Verification',
        icon: 'id-card-outline',
        content: `Registration Requirements:`,
        body:`• Must be at least 18 years old with valid Nigerian Driver's License
• Must possess valid vehicle registration and roadworthiness certificate from FRSC
• Must maintain current Third-Party or Comprehensive vehicle insurance
• Must complete NIN/BVN verification for identity confirmation
• Must pass background checks including driving history and criminal record
• Must provide accurate and current contact information
• Must maintain a smartphone with GPS capability and reliable internet access
• Registration may be suspended or terminated for providing false information`
    },
    {
        id: 'service-standards',
        title: 'Service Standards & Conduct',
        icon: 'ribbon-outline',
        content: `Professional Conduct Requirements:`,
        body:`• Maintain professional appearance and courteous communication with Senders
• Handle all packages with care and follow specific handling instructions
• Use provided navigation tools for efficient route planning
• Arrive at pickup locations within the estimated time window
• Verify package details and condition before acceptance
• Obtain proper delivery confirmation (OTP, signature, photo proof)
• Report any delivery issues or safety concerns immediately
• Maintain vehicle cleanliness and presentable condition
• Comply with all traffic laws and road safety regulations`
    },
    {
        id: 'earnings-payments',
        title: 'Earnings & Payment Terms',
        icon: 'cash-outline',
        content: `Payment Structure:`,
        body:`• Service Fees are calculated based on distance, package size, and demand factors
• Platform Commission ranges from 15-20% based on driver tier and performance
• Tips and bonuses are 100% yours with no commission deducted
• Earnings are held in escrow and released after successful delivery confirmation
• Weekly payouts processed every Monday for previous week's completed deliveries
• Instant transfers available for a small convenience fee (₦50-₦100)
• You are responsible for declaring income and paying applicable taxes to FIRS
• The Platform provides monthly earnings statements for tax purposes`
    },
    {
        id: 'cancellation-policy',
        title: 'Cancellation & No-Show Policy',
        icon: 'close-circle-outline',
        content: `Cancellation Guidelines:`,
        body:`• You may decline Delivery Requests without penalty, but acceptance rate affects priority
• Cancellations after acceptance but before pickup affect your completion rate
• Cancellations after pickup are only permitted for valid safety or operational reasons
• Excessive cancellations (above 30% weekly rate) may result in temporary suspension
• Valid cancellation reasons: safety concerns, vehicle breakdown, incorrect package details
• Sender cancellations after you've started traveling entitle you to partial compensation
• Repeated no-shows or pattern cancellations lead to account deactivation`
    },
    {
        id: 'safety-security',
        title: 'Safety & Security Protocols',
        icon: 'shield-checkmark-outline',
        content: `Safety Requirements:`,
        body:`• Always prioritize personal safety over delivery completion
• Use the emergency button for immediate security assistance
• Report suspicious packages or senders immediately through the app
• Maintain valid vehicle insurance and safety equipment at all times
• Follow all road safety regulations and avoid risky driving behavior
• Do not accept prohibited items (illegal substances, weapons, hazardous materials)
• Keep your vehicle in safe operating condition with regular maintenance
• The Platform provides 24/7 security support and emergency response coordination`
    },
    {
        id: 'ratings-performance',
        title: 'Ratings & Performance Management',
        icon: 'star-outline',
        content: `Performance System:`,
        body:`• Senders rate your service on a 5-star scale after each delivery
• Your overall rating affects your priority for high-value Delivery Requests
• Performance metrics tracked: acceptance rate, completion rate, on-time delivery, customer rating
• Driver tiers: Bronze (0-100 deliveries), Silver (100-500, 4.5+ rating), Gold (500+, 4.8+ rating)
• Higher tiers receive lower commission rates and priority access to premium deliveries
• Ratings below 3.5 trigger performance improvement plans
• Consistent ratings below 3.0 may result in account deactivation
• You may dispute unfair ratings with supporting evidence within 48 hours`
    },
    {
        id: 'vehicle-requirements',
        title: 'Vehicle & Equipment Standards',
        icon: 'car-outline',
        content: `Vehicle Requirements:`,
        body:`• Vehicles must be 2008 model year or newer (cars), 2015 or newer (motorcycles)
• Valid vehicle registration and roadworthiness certificate required
• Current insurance coverage (Third-Party minimum, Comprehensive recommended)
• Regular maintenance records must be maintained
• Vehicle inspection may be required upon registration and periodically
• Motorcycles must have proper safety gear including helmets
• Vehicle changes must be reported and re-verified within 7 days
• The Platform may suspend accounts for vehicles in unsafe condition`
    },
    {
        id: 'insurance-liability',
        title: 'Insurance & Liability',
        icon: 'umbrella-outline',
        content: `Insurance Coverage:`,
        body:`• You are responsible for maintaining valid vehicle insurance
• The Platform provides commercial auto coverage during active deliveries
• Standard coverage includes liability protection and basic cargo insurance
• High-value items require additional insurance declaration
• You are liable for damages caused by negligence or violation of platform policies
• Accident procedures: ensure safety, document scene, contact support, file police report if needed
• Insurance claims must be filed within 24 hours of incident
• The Platform assists with insurance coordination for platform-covered incidents`
    },
    {
        id: 'intellectual-property',
        title: 'Intellectual Property & Data',
        icon: 'lock-closed-outline',
        content: `Data Usage & Platform Rights:`,
        body:`• The Platform owns all intellectual property related to the app and services
• You grant the Platform license to use your name, photo, and vehicle information for service provision
• GPS and delivery data are collected for service optimization and safety monitoring
• Your personal data is protected under Nigeria Data Protection Regulation (NDPR)
• You may not misuse platform data or attempt to bypass the Platform for direct business
• All delivery transactions must occur through the Platform to maintain insurance coverage
• Violation of data policies may result in immediate account termination`
    },
    {
        id: 'suspension-termination',
        title: 'Suspension & Termination',
        icon: 'warning-outline',
        content: `Account Actions:`,
        body:`• The Platform may suspend accounts for policy violations, safety concerns, or legal requirements
• Temporary suspension reasons: low ratings, excessive cancellations, document expiration
• Permanent termination reasons: fraud, theft, safety violations, prohibited items, fake identity
• You will receive written notice of suspension or termination with specific reasons
• Appeal process available within 7 days of suspension/termination notice
• Final earnings will be paid out after account closure minus any valid deductions
• Reactivation may be possible for temporary suspensions after meeting requirements`
    },
    {
        id: 'dispute-resolution',
        title: 'Dispute Resolution',
        icon: 'scale-outline',
        content: `Conflict Resolution Process:`,
        body:`• Delivery disputes should be reported immediately through the app with supporting evidence
• The Platform's resolution team mediates between Drivers and Senders
• Escrow funds are held until dispute resolution
• Unresolved disputes may be escalated to binding arbitration under Nigerian Arbitration Act
• Legal proceedings shall be conducted in English in courts of Abuja, FCT
• Both parties agree to attempt good-faith negotiation before legal action
• The Platform's decisions on disputes are final and binding for platform-related matters`
    },
    {
        id: 'modifications',
        title: 'Terms Modification',
        icon: 'refresh-outline',
        content: `Policy Updates:`,
        body:`• The Platform reserves the right to modify these terms with 30 days' notice
• Significant changes will be communicated via email, in-app notifications, and SMS
• Continued use of the Platform after changes constitutes acceptance
• You may terminate your account if you do not agree with modified terms
• Current terms are always available in the Driver App and website
• Material changes to commission structure require 45 days' notice
• Emergency modifications for legal or safety reasons may be implemented immediately`
    },
    {
        id: 'miscellaneous',
        title: 'Miscellaneous Provisions',
        icon: 'ellipsis-horizontal-outline',
        content: `Additional Terms:`,
        body:`• These terms constitute the entire agreement between you and the Platform
• If any provision is found invalid, the remaining terms remain in effect
• No partnership, joint venture, or employment relationship is created
• You are responsible for compliance with all applicable Nigerian laws and regulations
• The Platform may assign these terms to affiliates or successors
• Notices may be delivered electronically through the app or registered email
• Force majeure events relieve the Platform from liability for service interruptions`
    }
];

export const driverFaqData = {
    'Getting Started': {
        icon: 'rocket-launch',
        iconFamily: 'MaterialIcons',
        color: '#3B82F6',
        questions: [
            {
                question: "What are the requirements to become a driver?",
                answer: "To join our platform as a driver, you need: (1) A valid Nigerian Driver's License, (2) Vehicle registration and roadworthiness certificate from FRSC, (3) Valid vehicle insurance (Third-Party or Comprehensive), (4) NIN/BVN verification for identity confirmation, (5) Smartphone with GPS capability, (6) Clean driving record verified through background checks. You must be at least 18 years old with minimum one year of driving experience."
            },
            {
                question: "How long does the driver verification process take?",
                answer: "The verification process typically takes 2-5 business days. This includes document review, background checks with FRSC and local law enforcement, vehicle inspection verification, and identity validation through NIN/BVN. You'll receive real-time updates on your application status via SMS and app notifications."
            },
            {
                question: "What types of vehicles are accepted on the platform?",
                answer: "We accept motorcycles (dispatch bikes), tricycles (Keke NAPEP), cars, vans, and small trucks. All vehicles must have valid registration, current roadworthiness certificates, and appropriate insurance coverage. Motorcycles must have helmets and safety gear, while larger vehicles need proper cargo securing equipment."
            },
            {
                question: "Is there a registration fee to become a driver?",
                answer: "No, there is no upfront registration fee. Our platform is free to join. However, we charge a service commission on completed deliveries. You only pay when you earn, making it risk-free to start."
            },
            {
                question: "Can I drive part-time or do I need to be full-time?",
                answer: "You have complete flexibility! You can drive part-time, full-time, or whenever you want. Set your own schedule by turning your availability on/off in the app. Many drivers work around other commitments, while others drive full-time for maximum earnings."
            },
            {
                question: "What happens after my application is approved?",
                answer: "Once approved, you'll receive an activation email and SMS. Log into the driver app, complete the onboarding tutorial, set up your payment information for withdrawals, and toggle your availability to 'Online' to start receiving delivery requests immediately."
            }
        ]
    },
    'Earnings & Payments': {
        icon: 'attach-money',
        iconFamily: 'MaterialIcons',
        color: '#10B981',
        questions: [
            {
                question: "How much can I earn as a driver?",
                answer: "Earnings vary based on delivery volume, distance, and time commitment. Active drivers typically earn ₦15,000-₦50,000 weekly. Factors affecting earnings include: delivery completion rate, peak hours (higher demand = higher fares), vehicle type (larger vehicles command higher rates), and customer ratings (high-rated drivers get priority offers)."
            },
            {
                question: "How is my payment calculated per delivery?",
                answer: "Your payment includes: Base fare (calculated by distance), Weight/size premium (heavier items earn more), Urgency bonus (express deliveries pay extra), Peak time multipliers (1.5x-2x during high demand). The platform commission is deducted before payout. You'll see the exact amount you'll earn before accepting any request."
            },
            {
                question: "When and how do I receive my earnings?",
                answer: "Earnings are held in escrow and released after successful delivery confirmation (recipient OTP + photo proof). You can withdraw funds to your bank account or mobile wallet anytime through the app. Standard withdrawals process in 1-2 business days (free), while instant transfers complete within minutes for a small fee (₦50-₦100)."
            },
            {
                question: "What is the platform commission structure?",
                answer: "The platform charges a 15-20% commission on completed deliveries, depending on your driver tier. Higher-rated drivers with more completed deliveries enjoy lower commission rates. Bonuses and tips from customers are 100% yours with no commission deducted."
            },
            {
                question: "Do I receive tips from customers?",
                answer: "Yes! Customers can tip you directly through the app after delivery completion. Tips are 100% yours with zero commission. Providing excellent service, timely delivery, and professional communication increases your tip earnings significantly."
            },
            {
                question: "What happens if a customer cancels after I've started driving?",
                answer: "If cancellation occurs after you've accepted and started traveling to pickup, you'll receive a partial compensation (typically ₦200-₦500) for your time and fuel. The amount depends on how far you've traveled. Frequent customer cancellations are tracked and penalized by the system."
            },
            {
                question: "Are there bonuses or incentive programs?",
                answer: "Yes! We offer multiple incentive programs: Weekly completion bonuses (complete 50+ deliveries for extra ₦5,000-₦10,000), Referral bonuses (earn ₦2,000 for every new driver you bring), Peak hour multipliers (1.5x-2x earnings during rush periods), Monthly top performer awards, and Perfect rating bonuses for maintaining 5-star service."
            }
        ]
    },
    'Delivery Operations': {
        icon: 'local-shipping',
        iconFamily: 'MaterialIcons',
        color: '#F59E0B',
        questions: [
            {
                question: "How do I receive delivery requests?",
                answer: "When you're online and available, delivery requests from nearby senders are pushed to your app via notifications. You'll see: pickup and drop-off locations, package size/weight, estimated distance and time, offered payment amount, and customer rating. You have 60 seconds to accept or counter-offer before the request goes to other drivers."
            },
            {
                question: "Can I reject delivery requests without penalty?",
                answer: "Yes, you can decline requests without immediate penalty. However, your acceptance rate is tracked and affects your driver score. Consistently low acceptance rates (below 50%) may reduce your priority for high-value deliveries. We recommend only going online when you're ready to accept requests."
            },
            {
                question: "What is the counter-offer feature and how does it work?",
                answer: "If you feel the offered price is too low, you can send a counter-offer with your proposed amount. The sender receives your counter-offer and can accept, decline, or negotiate further. Counter-offers work best when you explain your reasoning (e.g., 'Traffic is heavy,' or 'Long distance requires fuel'). Be reasonable—excessive counter-offers may lead to rejections."
            },
            {
                question: "What should I do if the pickup address is wrong or unclear?",
                answer: "Use the in-app chat or call button to contact the sender immediately for clarification. If you cannot locate the sender after reasonable attempts (10-15 minutes), you can cancel the delivery with proof (screenshots, call logs). You'll receive partial compensation for your time, and the sender will be flagged for providing incorrect information."
            },
            {
                question: "How do I confirm successful delivery?",
                answer: "Upon arrival at the drop-off location: (1) Request the 6-digit OTP code from the recipient, (2) Enter the OTP in your app, (3) Take a clear photo of the recipient with the package, (4) Submit the delivery confirmation. Only after completing all steps are your earnings released from escrow."
            },
            {
                question: "What if the recipient refuses to accept the package?",
                answer: "If the recipient refuses delivery, document the situation with photos/videos and contact support immediately through the app. Do not abandon the package. You may need to return it to the sender (you'll be compensated for the return trip) or deliver it to a platform-authorized holding location. Follow support team instructions carefully."
            },
            {
                question: "Can I make multiple deliveries at once?",
                answer: "Yes, if you have the capacity! You can accept multiple delivery requests going in the same direction to maximize earnings and efficiency. The app provides optimized routing to help you complete multiple deliveries quickly. Ensure you can safely handle multiple packages without damage."
            },
            {
                question: "What happens if I get into an accident during delivery?",
                answer: "Your safety is priority. If involved in an accident: (1) Ensure everyone's safety and call emergency services if needed, (2) Document the scene with photos, (3) Notify our platform support immediately via the emergency button, (4) File a police report if required, (5) Submit your insurance claim. The platform will assist with the process and pause your account temporarily until resolved."
            }
        ]
    },
    'Safety & Security': {
        icon: 'shield',
        color: '#EF4444',
        questions: [
            {
                question: "How does the platform ensure my safety as a driver?",
                answer: "We implement multiple safety measures: (1) All senders undergo KYC verification (NIN/BVN), (2) Real-time GPS tracking for emergency response, (3) In-app emergency button directly connected to security team, (4) Payment held in escrow (no cash handling reduces robbery risk), (5) Sender ratings and history visible before acceptance, (6) 24/7 security support hotline."
            },
            {
                question: "What should I do if I feel unsafe during a delivery?",
                answer: "Trust your instincts. If you feel unsafe: (1) Press the in-app emergency button immediately to alert our security team and share your live location with authorities, (2) Cancel the delivery and leave the area, (3) Contact our emergency hotline, (4) File a detailed incident report. You will not be penalized for safety-related cancellations, and the sender will be investigated."
            },
            {
                question: "Are there restricted or prohibited items I should refuse?",
                answer: "Yes, you must refuse: illegal drugs/substances, weapons and ammunition, hazardous/flammable materials, live animals (unless pre-approved pet transport), perishable food without proper packaging, items exceeding platform weight limits, suspicious packages without proper description. Accepting prohibited items violates platform policy and Nigerian law, leading to immediate account suspension and legal consequences."
            },
            {
                question: "How is my personal information protected?",
                answer: "Your data is protected by: AES-256 encryption for all sensitive information, Compliance with Nigeria Data Protection Regulation (NDPR), Limited data sharing (senders only see your first name and vehicle type), Secure payment processing through certified gateways, No selling of driver data to third parties. Only your driver ID, ratings, and vehicle type are visible to customers."
            },
            {
                question: "What happens if a sender makes false accusations against me?",
                answer: "All deliveries have digital proof (GPS logs, photos, OTP confirmations, timestamps). If accused falsely: (1) The platform investigates using delivery evidence, (2) Your earnings remain protected in escrow until resolution, (3) False accusers face penalties including account suspension and blacklisting, (4) You can submit counter-evidence and testimonials. Our system favors drivers with strong proof and good ratings."
            },
            {
                question: "Can I see a sender's rating and history before accepting?",
                answer: "Yes! Before accepting any request, you can view: sender's overall rating (1-5 stars), number of completed deliveries, cancellation rate, and recent reviews from other drivers. This helps you make informed decisions and avoid problematic senders."
            }
        ]
    },
    'Account & Ratings': {
        icon: 'star-rate',
        iconFamily: 'MaterialIcons',
        color: '#8B5CF6',
        questions: [
            {
                question: "How does the driver rating system work?",
                answer: "After each delivery, senders rate you on a 5-star scale. Your overall rating is the average of all ratings received. Ratings are based on: Timeliness (on-time delivery), Professionalism (communication and behavior), Package handling (condition on delivery), Overall experience. Your rating is prominently displayed and affects your priority for high-value deliveries."
            },
            {
                question: "What happens if my rating drops below a certain threshold?",
                answer: "Maintaining a good rating (4.0+) is crucial. If your rating falls below 3.5: (1) You'll receive fewer delivery offers, (2) You'll be placed on a 'Performance Improvement' plan with mandatory training, (3) Ratings below 3.0 may lead to temporary suspension, (4) Consistent low ratings (below 3.0 for 30 days) result in permanent deactivation. You'll receive warnings before any action."
            },
            {
                question: "Can I dispute an unfair rating?",
                answer: "Yes, you can dispute ratings within 48 hours of receipt. Provide evidence (photos, chat logs, GPS data) supporting your case. Our review team investigates and may remove ratings proven to be unjust or retaliatory. However, only ratings with clear evidence of abuse are removed—subjective poor service ratings stand."
            },
            {
                question: "How can I improve my driver rating?",
                answer: "Tips for better ratings: (1) Always communicate promptly with senders, (2) Arrive on time (or notify if delayed), (3) Handle packages with visible care, (4) Be professional and courteous, (5) Keep your vehicle clean, (6) Follow delivery instructions exactly, (7) Go the extra mile (help elderly recipients, deliver to door instead of gate). Small gestures create excellent experiences."
            },
            {
                question: "What are driver tiers and how do I advance?",
                answer: "We have three driver tiers: Bronze (0-100 deliveries), Silver (100-500 deliveries, 4.5+ rating), Gold (500+ deliveries, 4.8+ rating). Benefits increase per tier: lower commission rates, priority access to high-value deliveries, exclusive bonuses, faster payouts, dedicated support. Maintain excellent ratings and complete deliveries consistently to advance."
            },
            {
                question: "Can I update my profile or vehicle information?",
                answer: "Yes, update your profile anytime through the app. For basic info (phone, photo), changes are instant. For sensitive updates (vehicle change, license renewal, insurance update), you'll need to re-submit documents for verification. Keep your information current to avoid account suspension."
            }
        ]
    },
    'Issues & Support': {
        icon: 'alert-circle',
        color: '#EC4899',
        questions: [
            {
                question: "What should I do if the app crashes or malfunctions?",
                answer: "First, try these steps: (1) Force close and restart the app, (2) Check your internet connection, (3) Clear app cache in device settings, (4) Update to the latest app version, (5) Restart your phone. If issues persist, contact tech support with your device model and error screenshots. For active deliveries, call our emergency hotline immediately."
            },
            {
                question: "How do I report a problem with a delivery?",
                answer: "Report issues immediately: (1) Tap 'Report Issue' button in the active delivery screen, (2) Select issue type (wrong address, package mismatch, recipient unavailable, accident/incident, safety concern), (3) Provide detailed description and photos, (4) Submit report. Support team responds within 15-30 minutes for urgent issues."
            },
            {
                question: "What if a sender doesn't provide the OTP code?",
                answer: "The OTP is mandatory for delivery completion. If the recipient refuses or cannot provide it: (1) Politely explain it's required for confirmation, (2) Contact the sender via in-app chat/call for assistance, (3) If unresolved after 10 minutes, contact support with photo proof of delivery attempt. Support will manually verify and release your payment. Do not leave packages without OTP confirmation."
            },
            {
                question: "How quickly does customer support respond?",
                answer: "Response times vary by urgency: Emergency issues (safety, accidents): Immediate response via emergency hotline (24/7), Active delivery problems: 15-30 minutes via in-app chat, Payment/earnings inquiries: 2-4 hours during business hours (8am-8pm), General questions: 24-48 hours via email. Use the appropriate channel for faster resolution."
            },
            {
                question: "What happens if I lose or damage a package?",
                answer: "If a package is lost or damaged: (1) Report immediately through the app with full details, (2) Document the situation with photos/videos, (3) Cooperate fully with investigation, (4) Your earnings for that delivery will be withheld, (5) You may be required to compensate the sender based on declared value, (6) Insurance may cover some losses if applicable. Repeated incidents lead to account suspension."
            },
            {
                question: "Can I contact the sender directly outside the app?",
                answer: "No, all communication should happen through the in-app chat or call features. This protects both parties' privacy and provides recorded evidence for dispute resolution. Sharing personal contact information or conducting business outside the platform violates our terms and can lead to account suspension."
            },
            {
                question: "How do I appeal an account suspension?",
                answer: "If your account is suspended: (1) You'll receive an email detailing the reason, (2) Review the violation and gather supporting evidence, (3) Submit an appeal through the support portal within 7 days, (4) Provide comprehensive explanation and proof, (5) Appeals are reviewed within 5-10 business days. Decisions on serious violations (fraud, safety issues) are typically final."
            }
        ]
    },
    'Policies & Compliance': {
        icon: 'help-circle',
        color: '#6366F1',
        questions: [
            {
                question: "What happens if I violate platform policies?",
                answer: "Violations are treated seriously: Minor violations (late deliveries, poor communication): Warnings and rating penalties, Moderate violations (excessive cancellations, customer complaints): Temporary suspension (3-14 days), Severe violations (fraud, theft, prohibited items, fake identity): Permanent ban and legal reporting to EFCC/Nigerian Police. Your offense history is tracked, and repeat violations escalate penalties."
            },
            {
                question: "Am I required to have vehicle insurance?",
                answer: "Yes, valid vehicle insurance is mandatory and must be maintained at all times. You need either Third-Party or Comprehensive insurance coverage. Upload proof during registration and update whenever renewed. Driving without valid insurance violates platform policy and Nigerian law, resulting in immediate account suspension."
            },
            {
                question: "Do I need to pay taxes on my earnings?",
                answer: "Yes, as an independent contractor, you're responsible for declaring your income and paying applicable taxes to FIRS. The platform provides monthly earnings statements to help with tax filing. We recommend consulting a tax professional. We may be required to report high-earning drivers to tax authorities under Nigerian law."
            },
            {
                question: "Can I refer other drivers and earn bonuses?",
                answer: "Yes! Our referral program rewards you for bringing quality drivers to the platform. Share your unique referral code. When your referral completes their first 20 deliveries with a 4.0+ rating, you earn ₦2,000 bonus. There's no limit to referral earnings—the more qualified drivers you bring, the more you earn!"
            },
            {
                question: "What is the platform's cancellation policy?",
                answer: "Cancellations before accepting a request: No penalty. Cancellations after acceptance but before pickup: Tracked in your stats; frequent cancellations reduce your acceptance rate. Cancellations after pickup: Only allowed for valid reasons (safety concerns, wrong package, recipient unavailable). Unjustified cancellations after pickup incur penalties (₦500-₦1,000 deduction) and affect your ratings."
            },
            {
                question: "How long does my account stay active if I'm inactive?",
                answer: "Accounts remain active for 6 months of inactivity. After that, you'll receive an email notification. If you don't log in within 30 days of the notice, your account is deactivated (not deleted). To reactivate, log back in and update any expired documents (license, insurance, etc.). Extended inactivity may require re-verification."
            },
            {
                question: "Can I delete my driver account permanently?",
                answer: "Yes, you can request account deletion through app settings. Note: Account deletion is permanent and irreversible, pending earnings will be paid out first, all data will be deleted within 30 days per NDPR compliance, you cannot re-register with the same phone number/NIN for 90 days. Consider temporary deactivation instead if you might return."
            }
        ]
    },
    'Technical & App': {
        icon: 'smartphone',
        iconFamily: 'MaterialIcons',
        color: '#14B8A6',
        questions: [
            {
                question: "What phone requirements do I need to use the app?",
                answer: "Minimum requirements: Android 8.0+ or iOS 12+, At least 2GB RAM for smooth performance, GPS capability (mandatory for tracking), Stable internet connection (3G minimum, 4G recommended), Minimum 100MB free storage space. The app works best with newer devices and reliable data plans."
            },
            {
                question: "How does GPS tracking work and why is it required?",
                answer: "GPS tracking is mandatory for: Safety (emergency response and driver location), Delivery proof (confirms you reached pickup/drop-off locations), Route optimization (helps you navigate efficiently), Customer transparency (senders track delivery progress). GPS must remain on during active deliveries. Turning it off may result in penalties and lost earnings."
            },
            {
                question: "Does the app drain my phone battery quickly?",
                answer: "The app is optimized for battery efficiency, but GPS tracking does consume power. Tips to manage battery: Keep your phone charged while driving (use car charger), Close unnecessary background apps, Lower screen brightness, Enable battery saver mode when not on an active delivery, Consider carrying a power bank for long shifts."
            },
            {
                question: "How do I update the driver app?",
                answer: "Updates are released regularly for improvements and bug fixes. Enable automatic updates in your app store (Google Play/Apple App Store) for seamless updates. You'll receive in-app notifications when updates are available. Critical updates may be mandatory—failure to update may temporarily restrict access until you upgrade."
            },
            {
                question: "What should I do if I experience network connectivity issues?",
                answer: "If you lose connection during a delivery: (1) The app saves your progress locally, (2) Continue to the destination if directions are already loaded, (3) Complete the delivery when connection resumes, (4) Contact support if offline for extended periods. For persistent connectivity issues, consider switching mobile data providers or checking your device settings."
            }
        ]
    }
};
