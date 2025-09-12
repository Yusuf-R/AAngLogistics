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
    HOME: '/client/dashboard',
    ORDERS: '/client/orders',
    PROFILE: '/client/profile',
    WALLET: '/client/wallet',
    NOTIFICATIONS: '/client/notifications',

    // Nested Routes (No Tab Bar)
    SECURITY: '/client/profile/security',
    'VERIFY-EMAIL': '/client/profile/verify-email',
    'UPDATE-PASSWORD': '/client/profile/update-password',
    'AUTH-PIN': '/client/profile/auth-pin',
    'UPDATE-PIN': '/client/profile/update-pin',
    'RESET-PIN': '/client/profile/reset-pin',
    TC: '/client/profile/tcs',
    UTILITY: '/client/profile/utility',
    'EDIT-PROFILE': '/client/profile/edit-profile',
    'UPDATE-AVATAR': '/client/profile/update-avatar',
    "PRIVACY-POLICY": '/client/profile/privacy-policy',
    "LOCATION": '/client/profile/location',
    "PAYMENT": '/client/profile/payment',
    'HELP-CENTER': '/client/profile/help-center',
    'NIN-VERIFICATION': '/client/profile/nin-verification',

    // Add other nested routes here
    'ORDER-CREATE': '/client/orders/create',
    'ORDER-MANAGE': '/client/orders/manage',
    'ORDER-VIEW': '/client/orders/view',
};

// Explicit list of routes where Tab Bar should appear
export const TAB_BAR_VISIBLE_ROUTES = [
    ROUTES.HOME,
    ROUTES.ORDERS,
    ROUTES.PROFILE,
    ROUTES.WALLET,
    ROUTES.NOTIFICATIONS,
];

export const TAB_BAR_HIDDEN_EXCEPTIONS = [
    // PROFILE
    '/client/profile/edit-profile',
    '/client/profile/update-password',
    '/client/profile/location',
    '/client/profile/update-avatar',
    '/client/profile/privacy-policy',
    '/client/profile/security',
    '/client/profile/nin-verification',
    '/client/profile/payment',
    '/client/profile/auth-pin',
    '/client/profile/reset-pin',
    '/client/profile/help-center',
    '/client/profile/tcs',
    '/client/profile/verify-email',
    '/client/profile/utility',
    //  ORDERS
    '/client/orders/create',
    '/client/orders/manage',
    '/client/orders/view',
    '/client/orders/payment-status',
];

//
export const SocketEvents = {
    NOTIFICATION: {
        NEW: 'notification',
        MARK_READ: 'notification:read:single',
        MARK_READ_ALL: 'notification:read:all',
        DELETE: 'notification:delete',
        DELETE_SUCCESS: 'notification:delete:success',
        ERROR: 'notification:error'
    },
    PING: {
        HEALTH: 'ping:health',
    },
    // Add more groups as you grow (e.g., CHAT, ORDER, etc.)
};

// Utility to check password change capability (can be used elsewhere in your app)
export const canUserChangePassword = (userData) => {
    // Multiple layers of validation

    // 1. Backend explicitly says it's allowed
    if (userData.passwordChangeAllowed === true) {
        return {allowed: true, reason: null};
    }

    // 2. Backend explicitly says it's not allowed
    if (userData.passwordChangeAllowed === false) {
        return {
            allowed: false,
            reason: 'Account type does not support password changes'
        };
    }

    // 3. Check auth methods (fallback)
    if (userData.authMethods) {
        const hasCredentials = userData.authMethods.some(method => method.type === 'Credentials');
        if (!hasCredentials) {
            return {
                allowed: false,
                reason: 'Account created with social login only'
            };
        }
        return {allowed: true, reason: null};
    }

    // 4. Check primary provider (second fallback)
    if (userData.primaryProvider && userData.primaryProvider !== 'Credentials') {
        return {
            allowed: false,
            reason: `Account managed by ${userData.primaryProvider}`
        };
    }

    // 5. Default to not allowed for safety
    return {
        allowed: false,
        reason: 'Unable to verify account type'
    };
};

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

// Terms and Conditions Constants
export const sections = [
    {
        id: 'definitions',
        title: 'Definitions',
        icon: 'document-text-outline',
        content: [
            {term: 'Company', definition: 'refers to AANG Logistics, a registered logistics service provider.'},
            {term: 'Customer', definition: 'refers to the individual or entity using the Company\'s services.'},
            {
                term: 'Goods',
                definition: 'refers to the items being transported, stored, or handled by our logistics services.'
            },
            {term: 'Services', definition: 'refers to all logistics and related services provided by the Company.'},
        ]
    },
    {
        id: 'scope',
        title: 'Scope of Services',
        icon: 'car-outline',
        content: `AANG Logistics provides comprehensive logistics services including:

• Transportation services (road and rail)
• Last-mile delivery solutions
`
    },
    {
        id: 'obligations',
        title: 'Customer Obligations',
        icon: 'checkmark-circle-outline',
        content: `As our valued customer, you agree to:

• Provide accurate and complete shipment details (weight, dimensions, contents, destination)
• Ensure goods are properly packed, labeled, and comply with all legal and safety requirements
• Notify the Company immediately of any hazardous materials or special handling requirements
• Pay all applicable charges as per the agreed terms and conditions
• Comply with all applicable laws and regulations`
    },
    {
        id: 'pricing',
        title: 'Quotations & Pricing',
        icon: 'card-outline',
        content: `Pricing Terms:

• Quotations are valid for 30 days unless otherwise specified
• Prices may be subject to change due to fuel surcharges, customs fees, or unforeseen circumstances
• Additional charges may apply for special handling, extended storage, or incorrect documentation
• All prices are exclusive of applicable taxes unless otherwise stated
• Volume discounts available for regular customers`
    },
    {
        id: 'payment',
        title: 'Payment Terms',
        icon: 'wallet-outline',
        content: `Payment Conditions:

• Payment is due within 30 days of invoice issuance
• Late payments may incur interest at 1.5% per month
• The Company reserves the right to withhold services or goods for unpaid invoices
• Accepted payment methods: Bank transfer, credit cards, and approved digital wallets
• Payment disputes must be raised within 7 days of invoice receipt`
    },
    {
        id: 'liability',
        title: 'Liability & Insurance',
        icon: 'shield-checkmark-outline',
        content: `Liability Framework:

• The Company's liability for loss or damage is limited to 3 times the freight charges or as per applicable law
• Customers must declare high-value goods and arrange additional insurance if needed
• The Company maintains comprehensive insurance coverage for standard operations
• We are not liable for delays caused by force majeure events (e.g., natural disasters, strikes, government actions).
`
    },
    {
        id: 'delivery',
        title: 'Delivery & Service Standards',
        icon: 'time-outline',
        content: `Delivery Terms:

• Estimated delivery times are provided as guidance and are not guaranteed
• Customers must inspect goods upon delivery and report any damages within 48 hours
• Storage fees may apply if the customer fails to accept delivery within the agreed timeframe
• Delivery attempts will be made during standard business hours (8 AM - 6 PM)
• Special delivery arrangements available upon request`
    },
    {
        id: 'force-majeure',
        title: 'Force Majeure',
        icon: 'warning-outline',
        content: `The Company is not liable for failures or delays due to events beyond our reasonable control, including:

• Natural disasters, floods, earthquakes, or severe weather conditions
• War, terrorism, or civil unrest
• Government restrictions, sanctions, or regulatory changes
• Labor strikes or industrial action
• Pandemic-related restrictions or quarantine measures
• Infrastructure failures or cyber attacks`
    },
    {
        id: 'cancellation',
        title: 'Cancellation & Refunds',
        icon: 'return-up-back-outline',
        content: `Cancellation Policy:

• Cancellations must be submitted in writing or through our mobile app
• Cancellations made 24 hours before scheduled pickup: Full refund minus 5% administrative fee
• Cancellations made less than 24 hours: 50% refund
• No refunds for services already commenced or completed
• Emergency cancellations will be reviewed on a case-by-case basis`
    },
    {
        id: 'governing-law',
        title: 'Governing Law & Dispute Resolution',
        icon: 'library-outline',
        content: `Legal Framework:

• These terms are governed by the laws of Nigeria and the Federal Capital Territory
• Any disputes shall first be resolved through good-faith negotiation
• Unresolved disputes may be submitted to binding arbitration under the Nigerian Arbitration Act
• The courts of Abuja, FCT shall have exclusive jurisdiction
• All legal proceedings shall be conducted in English`
    },
    {
        id: 'amendments',
        title: 'Terms Modification',
        icon: 'create-outline',
        content: `The Company reserves the right to modify these terms at any time. Changes will be communicated through:

• Email notifications to registered customers
• In-app notifications
• Website updates
• SMS alerts for significant changes

Continued use of our services after notification constitutes acceptance of the updated terms.`
    }
];

// FAQ Constants
export const faqData = {
    General: [
        {
            question: "How does the delivery platform work?",
            answer: "Our platform connects senders who need to transport items with available drivers. Simply create a delivery request, get an automated price estimate, and nearby drivers will receive notifications to accept or counter-offer your request."
        },
        {
            question: "What areas do you cover?",
            answer: "We operate nationwide across Nigeria, with drivers available in major cities and towns. The platform matches you with drivers within your specific location radius."
        },
        {
            question: "How is pricing calculated?",
            answer: "Pricing is automatically calculated based on distance, weight, urgency, and package type. Our dynamic pricing system adjusts based on demand and delivery conditions."
        },
        {
            question: "What items can I send?",
            answer: "You can send most legal items. Prohibited items include illegal goods, perishable items without proper packaging, hazardous materials, and items exceeding our weight limits."
        },
        {
            question: "What are your operating hours?",
            answer: "Our platform operates 24/7, but delivery availability may vary by location and time. Drivers set their own schedules, so you may find fewer options late at night."
        },
        {
            question: "How do I contact customer support?",
            answer: "Use the in-app chat feature for immediate assistance or email support@deliveryplatform.com. For urgent issues, call our hotline at +234-800-123-4567 (available 8am-8pm daily)."
        }
    ],
    Account: [
        {
            question: "How do I create an account?",
            answer: "Download our app and sign up with your phone number. You'll need to verify your identity using your NIN or BVN for security purposes before you can start using the platform."
        },
        {
            question: "Why do I need to verify my identity?",
            answer: "Identity verification (KYC) helps us maintain a secure platform, prevent fraud, and comply with Nigerian regulations. We use your NIN/BVN to verify your identity."
        },
        {
            question: "Can I have multiple accounts?",
            answer: "No, each person is allowed only one account per verified identity. Multiple accounts are prohibited and will result in account suspension."
        },
        {
            question: "How do I update my profile information?",
            answer: "Go to your profile settings in the app where you can update your contact information, address, and preferences. Some changes may require re-verification."
        },
        {
            question: "What should I do if I can't access my account?",
            answer: "Use the 'Forgot Password' feature or contact our support team with proof of identity. For security reasons, we may require additional verification to restore access."
        },
        {
            question: "How do I delete my account?",
            answer: "Submit a request through the app settings. Note that account deletion is permanent and may take up to 30 days to fully process all associated data."
        }
    ],
    Service: [
        {
            question: "How do I track my delivery?",
            answer: "Once your delivery is accepted, you'll receive real-time GPS tracking updates. You can see your driver's location and estimated arrival time in the app."
        },
        {
            question: "What if my driver doesn't show up?",
            answer: "If a driver doesn't arrive within the agreed timeframe, you can cancel the request for a full refund. Drivers with frequent no-shows face penalties and account suspension."
        },
        {
            question: "Can I cancel my delivery request?",
            answer: "Yes, you can cancel before a driver accepts your request for a full refund. After acceptance, you have a 30-second window to cancel before charges apply."
        },
        {
            question: "What happens if my package gets lost or damaged?",
            answer: "All deliveries require photo proof and OTP confirmation. If your package is lost or damaged, report it immediately through the app. We have a compensation policy for verified cases."
        },
        {
            question: "How do I become a driver?",
            answer: "Apply through our driver portal with valid driver's license, vehicle registration, insurance, and pass our background verification. You'll also need NIN/BVN verification."
        },
        {
            question: "Can I schedule deliveries in advance?",
            answer: "Yes, you can schedule deliveries up to 7 days in advance. Scheduled requests are sent to drivers 2 hours before the pickup time."
        },
        {
            question: "What if my package is overweight?",
            answer: "Drivers may reject overweight packages. If discovered after pickup, you'll be charged an additional fee and may face account restrictions for repeated violations."
        },
        {
            question: "How are fragile items handled?",
            answer: "Clearly mark fragile items when creating your request. While we encourage careful handling, we recommend purchasing insurance for valuable fragile items."
        }
    ],
    Payment: [
        {
            question: "What payment methods do you accept?",
            answer: "We accept credit/debit cards, bank transfers, and digital wallets through secure payment gateways like Paystack and Flutterwave."
        },
        {
            question: "When am I charged for delivery?",
            answer: "Payment is held in escrow when you confirm a delivery request. Funds are only released to the driver after successful delivery confirmation with OTP and photo proof."
        },
        {
            question: "Why did my payment fail?",
            answer: "Payment failures can occur due to insufficient funds, expired cards, network issues, or security checks. Ensure your payment method is valid and has sufficient balance."
        },
        {
            question: "How do refunds work?",
            answer: "Refunds are processed automatically for valid cancellations or failed deliveries. The money is returned to your original payment method within 3-7 business days."
        },
        {
            question: "Are there any hidden charges?",
            answer: "No, all charges are transparent. You'll see the breakdown of delivery fee, service charge, and applicable taxes before confirming your request."
        },
        {
            question: "What is your VAT policy?",
            answer: "We charge 7.5% VAT on all service fees as required by Nigerian law. This is clearly displayed during checkout and on your receipt."
        },
        {
            question: "How do drivers receive their earnings?",
            answer: "Drivers can withdraw earnings to their bank accounts or mobile wallets. Processing takes 1-2 business days, with a small transaction fee for instant transfers."
        }
    ],
    Safety: [
        {
            question: "What safety measures are in place?",
            answer: "We require identity verification for all users, real-time tracking, delivery confirmation via OTP, and photo proof. All transactions are secured through our escrow payment system."
        },
        {
            question: "How do you verify drivers?",
            answer: "Drivers undergo thorough background checks including FRSC license verification, vehicle inspection, and NIN/BVN validation before being approved on our platform."
        },
        {
            question: "What should I do if I feel unsafe during a delivery?",
            answer: "Use the emergency button in the app to alert our security team and local authorities. We'll immediately track your location and dispatch assistance."
        },
        {
            question: "How is my personal data protected?",
            answer: "We comply with Nigeria Data Protection Regulation (NDPR), using AES-256 encryption for all sensitive data. Your information is never shared without consent."
        },
        {
            question: "What happens if a prohibited item is discovered?",
            answer: "Delivery will be immediately canceled, reported to authorities, and both sender and driver accounts will be suspended pending investigation."
        }
    ],
    Insurance: [
        {
            question: "Do you offer delivery insurance?",
            answer: "Yes, we offer optional insurance coverage for your items. You can select insurance coverage when creating your delivery request for an additional fee."
        },
        {
            question: "What does the insurance cover?",
            answer: "Insurance covers loss, theft, and accidental damage during transit. It does not cover improper packaging or prohibited items."
        },
        {
            question: "How do I file an insurance claim?",
            answer: "Report the issue immediately through the app with supporting evidence (photos, videos). Our claims team will investigate and process valid claims within 14 business days."
        },
        {
            question: "What items cannot be insured?",
            answer: "We cannot insure cash, jewelry, antiques, perishable goods, or any prohibited items. Please check our full list of uninsurable items in the Terms of Service."
        },
        {
            question: "How are insurance payouts calculated?",
            answer: "Payouts are based on the declared value of your item (with receipt proof) up to the maximum coverage limit. Deductibles may apply for certain claims."
        }
    ],
    Business: [
        {
            question: "Do you offer corporate accounts?",
            answer: "Yes, we provide special business accounts with features like bulk deliveries, dedicated account managers, and monthly invoicing. Contact our sales team for details."
        },
        {
            question: "Can I integrate with your API?",
            answer: "Enterprise clients can access our API for seamless logistics integration. Documentation is available for approved business partners."
        },
        {
            question: "What are your business hours for corporate support?",
            answer: "Our corporate support team is available Monday-Friday from 8am-6pm, with emergency support for critical delivery issues 24/7."
        },
        {
            question: "Do you offer volume discounts?",
            answer: "Businesses with regular high-volume deliveries qualify for discounted rates. Discount tiers are based on monthly delivery volume."
        }
    ],
    Technology: [
        {
            question: "What devices are supported?",
            answer: "Our app works on iOS (version 12+) and Android (version 8+) smartphones. We also have a web version for desktop users."
        },
        {
            question: "How do I update the app?",
            answer: "Updates are automatically pushed through app stores. Enable automatic updates in your device settings or manually update when notified."
        },
        {
            question: "What should I do if the app crashes?",
            answer: "Restart the app and your device. If issues persist, clear the app cache or reinstall. Report persistent problems to our tech support team."
        },
        {
            question: "Is my location data shared?",
            answer: "Location data is only used for delivery matching and tracking. We never sell or share your precise location data with third parties."
        }
    ]
};

// Dashboard Constants
export const serviceFeatures = [
    {
        icon: Zap,
        title: 'Instant Delivery',
        description: 'Same-day delivery across the city',
        color: '#F59E0B'
    },
    {
        icon: Shield,
        title: 'Secure & Insured',
        description: 'Your packages are fully protected',
        color: '#10B981'
    },
    {
        icon: Users,
        title: 'Trusted Couriers',
        description: 'Verified and professional drivers',
        color: '#3B82F6'
    }
];


// Order Utilities
// orderUtils.js - Utility functions for order creation
export const ORDER_TYPES = [
    {
        id: 'instant',
        title: 'Send Now',
        subtitle: 'Immediate pickup',
        icon: 'flash',
        color: ['#ff6b6b', '#ee5a24'],
        popular: true
    },
    {
        id: 'scheduled',
        title: 'Schedule',
        subtitle: 'Pick a time',
        icon: 'time',
        color: ['#667eea', '#764ba2']
    },
    {
        id: 'recurring',
        title: 'Recurring',
        subtitle: 'Regular deliveries',
        icon: 'repeat',
        color: ['#2ecc71', '#27ae60']
    }
];

export const ORDER_STEPS = [
    {id: 'type', title: 'Type', icon: 'package'},
    {id: 'locations', title: 'Locations', icon: 'map-pin'},
    {id: 'vehicle', title: 'Vehicle', icon: 'truck'},
    {id: 'review', title: 'Review', icon: 'check-circle'},
    {id: 'payment', title: 'Payment', icon: 'credit-card'},
]

export const PACKAGE_CATEGORIES = [
    {id: 'document', title: 'Documents', icon: 'document-text', color: '#3b82f6'},
    {id: 'parcel', title: 'Parcel', icon: 'cube', color: '#8b5cf6'},
    {id: 'food', title: 'Food', icon: 'restaurant', color: '#f59e0b'},
    {id: 'mobilePhone', title: 'Mobile Phone', icon: 'phone-portrait', color: '#10b981'},
    {id: 'laptop', title: 'Laptop', icon: 'laptop', color: '#063970'},
    {id: 'cake', title: 'Cake', icon: 'pie-chart', color: '#ec4899'},
    {id: 'clothing', title: 'Clothing', icon: 'shirt', color: '#f472b6'},
    {id: 'furniture', title: 'Furniture', icon: 'bed', color: '#f97316'},
    {id: 'electronics', title: 'Electronics', icon: 'hardware-chip', color: '#22713F'},
    {id: 'jewelry', title: 'Jewelry', icon: 'diamond', color: '#682271'},
    {id: 'gifts', title: 'Gifts', icon: 'gift', color: '#f43f5e'},
    {id: 'books', title: 'Books', icon: 'book', color: '#8b5cf6'},
    {id: 'fragile', title: 'Fragile', icon: 'warning', color: '#ef4444'},
    {id: 'medicine', title: 'Medicine', icon: 'medical', color: '#10b981'},
    {id: 'others', title: 'Others', icon: 'ellipsis-horizontal', color: '#9ca3af'}
];


/**
 * Calculate estimated pricing for an order
 * @param {Object} orderData - The order data object
 * @returns {Promise<Object>} - Pricing information
 */
export const calculateOrderPricing = async (orderData) => {
    try {
        // Extract relevant data for pricing calculation
        const {pickup, dropoff, package: packageData, vehicleRequirements, orderType} = orderData;

        // Calculate distance (you might want to use a proper distance calculation service)
        const distance = calculateDistance(
            pickup.coordinates.lat,
            pickup.coordinates.lng,
            dropoff.coordinates.lat,
            dropoff.coordinates.lng
        );

        // Base pricing logic
        let basePrice = 500; // Base price in your currency
        let distancePrice = distance * 50; // Price per km
        let vehicleMultiplier = getVehicleMultiplier(vehicleRequirements);
        let packageMultiplier = getPackageMultiplier(packageData);
        let urgencyMultiplier = orderType === 'instant' ? 1.2 : 1.0;

        // Calculate total
        const subtotal = (basePrice + distancePrice) * vehicleMultiplier * packageMultiplier * urgencyMultiplier;
        const tax = subtotal * 0.075; // 7.5% tax
        const total = subtotal + tax;

        return {
            basePrice,
            distancePrice,
            distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
            vehicleMultiplier,
            packageMultiplier,
            urgencyMultiplier,
            subtotal: Math.round(subtotal),
            tax: Math.round(tax),
            total: Math.round(total),
            currency: 'NGN',
            breakdown: [
                {label: 'Base Price', amount: basePrice},
                {label: `Distance (${Math.round(distance * 100) / 100}km)`, amount: Math.round(distancePrice)},
                {label: 'Vehicle Type', amount: Math.round((basePrice + distancePrice) * (vehicleMultiplier - 1))},
                {
                    label: 'Package Type',
                    amount: Math.round((basePrice + distancePrice) * vehicleMultiplier * (packageMultiplier - 1))
                },
                {
                    label: 'Urgency Fee',
                    amount: Math.round((basePrice + distancePrice) * vehicleMultiplier * packageMultiplier * (urgencyMultiplier - 1))
                },
                {label: 'Tax (7.5%)', amount: Math.round(tax)}
            ]
        };
    } catch (error) {
        console.error('Pricing calculation error:', error);
        throw new Error('Unable to calculate pricing at this time');
    }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} - Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const toRad = (deg) => {
    return deg * (Math.PI / 180);
};

/**
 * Get pricing multiplier based on vehicle requirements
 * @param {Array} vehicleRequirements - Array of required vehicle types
 * @returns {number} - Multiplier value
 */
const getVehicleMultiplier = (vehicleRequirements) => {
    if (!vehicleRequirements || vehicleRequirements.length === 0) return 1.0;

    const multipliers = {
        bicycle: 0.8,
        motorcycle: 1.0,
        tricycle: 1.2,
        van: 1.5,
        truck: 2.0,
        pickup: 1.8
    };

    // Use the highest multiplier if multiple vehicles are selected
    return Math.max(...vehicleRequirements.map(vehicle => multipliers[vehicle] || 1.0));
};

/**
 * Get pricing multiplier based on package characteristics
 * @param {Object} packageData - Package information
 * @returns {number} - Multiplier value
 */
const getPackageMultiplier = (packageData) => {
    let multiplier = 1.0;

    // Size-based multiplier
    if (packageData.weight?.value > 20) multiplier *= 1.3;
    if (packageData.dimensions?.length > 100 || packageData.dimensions?.width > 100) multiplier *= 1.2;

    // Special handling
    if (packageData.isFragile) multiplier *= 1.15;
    if (packageData.requiresSpecialHandling) multiplier *= 1.25;
    if (packageData.temperature?.controlled) multiplier *= 1.4;

    // High-value items
    if (packageData.value > 100000) multiplier *= 1.1; // For items over 100k

    return multiplier;
};

/**
 * Get device IP address
 * @returns {Promise<string>} - Device IP address
 */
export const getDeviceIP = async () => {
    try {
        const networkState = await Network.getNetworkStateAsync();
        return networkState.details?.ipAddress || 'unknown';
    } catch (error) {
        console.error('Error getting device IP:', error);
        return 'unknown';
    }
};

/**
 * Get device information
 * @returns {Promise<string>} - Device user agent string
 */
export const getDeviceInfo = async () => {
    try {
        const deviceInfo = {
            brand: Device.brand,
            manufacturer: Device.manufacturer,
            modelName: Device.modelName,
            osName: Device.osName,
            osVersion: Device.osVersion,
            platformApiLevel: Device.platformApiLevel,
            deviceType: Device.deviceType
        };

        return `${deviceInfo.manufacturer} ${deviceInfo.modelName} (${deviceInfo.osName} ${deviceInfo.osVersion})`;
    } catch (error) {
        console.error('Error getting device info:', error);
        return 'unknown';
    }
};

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - Whether the phone number is valid
 */
const isValidPhoneNumber = (phone) => {
    // Basic Nigerian phone number validation
    const phoneRegex = /^(\+234|234|0)?[789][01]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
};

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: NGN)
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount, currency = 'NGN') => {
    if (typeof amount !== 'number') return '₦0.00';

    const formatter = new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });

    return formatter.format(amount);
};

/**
 * Generate a unique order reference
 * @returns {string} - Order reference
 */
export const generateOrderRef = () => {
    const prefix = 'ORD';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
};

/**
 * Generate a delivery token
 * @returns {string} - Delivery token
 */
export const generateDeliveryToken = () => {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
};

export const timeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return `Yesterday`;
    return `${days}d ago`;
}

// Vehicle selection constants
/**
 * Some constant criterion for delivery options
 */
// utils/vehicleRules.js
export const VEHICLE_PROFILES = {
    bicycle: {
        maxWeightKg: 10,
        maxVolumeL: 40,
        maxDistanceKm: 12,
        fragileOk: false,
        speedTier: 1,
        costTier: 1,
        stability: 1,
        foodOk: true
    },
    motorcycle: {
        maxWeightKg: 25,
        maxVolumeL: 100,
        maxDistanceKm: 75,
        fragileOk: 'limited',
        speedTier: 3,
        costTier: 2,
        stability: 2,
        foodOk: true
    },
    tricycle: {
        maxWeightKg: 80,
        maxVolumeL: 300,
        maxDistanceKm: 75,
        fragileOk: true,
        speedTier: 2,
        costTier: 3,
        stability: 3,
        foodOk: true
    },
    car: {
        maxWeightKg: 200,
        maxVolumeL: 600,
        maxDistanceKm: 500,
        fragileOk: true,
        speedTier: 3,
        costTier: 4,
        stability: 4,
        foodOk: true
    },
    van: {
        maxWeightKg: 800,
        maxVolumeL: 2500,
        maxDistanceKm: 500,
        fragileOk: true,
        speedTier: 2,
        costTier: 5,
        stability: 5,
        foodOk: true
    },
    truck: {
        maxWeightKg: 3000,
        maxVolumeL: 10000,
        maxDistanceKm: 500,
        fragileOk: true,
        speedTier: 1,
        costTier: 6,
        stability: 6,
        foodOk: false
    },
};

export const CATEGORY_HINTS = {
    food: {prefer: ['bicycle', 'motorcycle', 'tricycle', 'car'], avoid: ['truck', 'van']},
    document: {prefer: ['bicycle', 'motorcycle', 'tricycle', 'car'], avoid: []},
    fragile: {prefer: ['car', 'van'], avoid: ['bicycle']},
    electronics: {prefer: ['motorcycle', 'tricycle', 'car', 'van'], avoid: ['bicycle']},
    furniture: {prefer: ['van', 'truck'], avoid: ['bicycle', 'motorcycle']},
    medicine: {prefer: ['motorcycle', 'car'], avoid: []},
    parcel: {prefer: ['motorcycle', 'car'], avoid: []},
    clothing: {prefer: ['motorcycle', 'car'], avoid: []},
    jewelry: {prefer: ['motorcycle', 'car', 'van'], avoid: ['bicycle']},
    gifts: {prefer: ['motorcycle', 'car'], avoid: []},
    others: {prefer: [], avoid: []},
};

export function haversineKm([lng1, lat1], [lng2, lat2]) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export function volumeLiters(dimensions) {
    if (!dimensions) return 0;
    const {length = 0, width = 0, height = 0, unit = 'cm'} = dimensions;
    const toCm = unit === 'inch' ? 2.54 : 1;
    const cm3 = (length * toCm) * (width * toCm) * (height * toCm);
    return cm3 / 1000; // L
};

export const ALL_TYPES = ['bicycle', 'motorcycle', 'tricycle', 'car', 'van', 'truck'];
