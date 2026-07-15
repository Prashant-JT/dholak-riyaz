// ============================================
// DATA: Songs with Taal identification
// ============================================

export interface Song {
    title: string;
    artist: string;
    taal: string;
    youtubeUrl: string;
    notes?: string;
}

export const SONGS: Song[] = [
    {
        title: "Itni Shakti Hai Dai / Aisi Kirpa Guru",
        artist: "Devocional",
        taal: "Keherwa (8 beats)",
        youtubeUrl: "https://youtu.be/m1Ft4JdgrBE?si=jazhC1TLeakR8xim"
    },
    {
        title: "Dagabaaz Re",
        artist: "Bollywood",
        taal: "Dadra (6 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=0KozfDYK1EU"
    },
    {
        title: "Sambhariyaan Sada Dil Me Tokhe",
        artist: "Devocional",
        taal: "Dadra (6 beats)",
        youtubeUrl: "https://youtu.be/72-POeN9XwQ"
    },
    {
        title: "Thumaka Chalata Ramachandra",
        artist: "Devocional",
        taal: "Dadra (6 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=8JAzZZSLZYQ"
    },
    {
        title: "Ye Daulat Bhi Lelo Ye Shohrat Bhi Lelo",
        artist: "Bollywood",
        taal: "Dadra (6 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=L7jFS5jYAjI"
    },
    {
        title: "Lab Par Aaye",
        artist: "Bollywood",
        taal: "Dadra (6 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=7kR6tqaq_zY"
    },
    {
        title: "Hey Naam Re Sabse Bada Tera Naam",
        artist: "Devocional",
        taal: "Dadra (6 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=UaFTHjUnOao",
        notes: "Después del min 0:50"
    },
    {
        title: "Aaj Humare Dil Mein",
        artist: "Bollywood",
        taal: "Dadra (6 beats)",
        youtubeUrl: "https://youtu.be/ABqsJBSBNBw?si=rwJaRwI78MFxwoT6"
    },
    {
        title: "Rangi Sari Gulabi Chunariya Re",
        artist: "Bollywood",
        taal: "Dadra (6 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=HL9fvHUweJs"
    },
    {
        title: "Hungama Hai Kyon Barpa",
        artist: "Bollywood",
        taal: "Keherwa (8 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=qDZ6oqW6JCM"
    },
    {
        title: "Kuch Toh Log Kahenge",
        artist: "Kishore Kumar",
        taal: "Keherwa (8 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=56I2rxRPRLY"
    },
    {
        title: "Naa Kajre Ki Dhar",
        artist: "Bollywood",
        taal: "Keherwa (8 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=v1rRI4GYTdY"
    },
    {
        title: "Payoji Maine Ram Ratan Dhan Payo",
        artist: "Devocional",
        taal: "Keherwa (8 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=eVzyOEhTBy8"
    },
    {
        title: "Baaje Re Muraliya Baaje",
        artist: "Devocional",
        taal: "Keherwa (8 beats)",
        youtubeUrl: "https://youtu.be/GP6dt_qW5qE?si=Cw1h8xQsU5RyVD1S"
    },
    {
        title: "Pretty Woman",
        artist: "Roy Orbison",
        taal: "Keherwa (8 beats)",
        youtubeUrl: "https://youtu.be/Gcne5Wt-Qfo?si=NhelC1xErAd-wnRA"
    },
    {
        title: "Patola",
        artist: "Guru Randhawa",
        taal: "Keherwa (8 beats)",
        youtubeUrl: "https://youtu.be/z-ZEHL4Df-A?si=tDsXGu62ZWS-WxPz"
    },
    {
        title: "Tum Mile Dil Kile",
        artist: "Bollywood",
        taal: "Keherwa (8 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=nqTS7ngviwQ"
    },
    {
        title: "Aye Mere Humsafar",
        artist: "Bollywood",
        taal: "Keherwa (8 beats)",
        youtubeUrl: "https://youtu.be/sWqjZpBtcxc?si=7FYByybDY_I9WQFk"
    },
    {
        title: "Lakdi Ki Kaathi",
        artist: "Infantil",
        taal: "Keherwa (8 beats)",
        youtubeUrl: "https://youtu.be/wSs2n5abdmg?si=taWsXUFXUfT1nH9M"
    },
    {
        title: "Chappa Chappa",
        artist: "Bollywood",
        taal: "Keherwa (8 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=HVa0owi2ZP4"
    },
    {
        title: "Dafali Wale Dafali Baja",
        artist: "Devocional",
        taal: "Keherwa (8 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=2s9lq9rLwp8"
    },
    {
        title: "Kaun Disa Mein Leke Chala Re Batohiya",
        artist: "Bollywood",
        taal: "Keherwa (8 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=D61BvxAOxm0"
    },
    {
        title: "Bahut Pyar Karte Hai",
        artist: "Bollywood",
        taal: "Keherwa (8 beats)",
        youtubeUrl: "https://youtu.be/rqEjOLu105I?si=DcFYTxAymhlHp2Ot"
    },
    {
        title: "Phero Na Nazar Se Najariya",
        artist: "Bollywood",
        taal: "Deepchandi (14 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=1_WaSnOnu1Q"
    },
    {
        title: "Aaj Jaane Ki Zid Na Karo",
        artist: "Farida Khanum",
        taal: "Deepchandi (14 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=CfUDuYAasjE"
    },
    {
        title: "Tera Chehra Jab Nazar Aaye",
        artist: "Bollywood",
        taal: "Deepchandi (14 beats)",
        youtubeUrl: "https://youtu.be/zNUs54J3mKo?si=gJeNGyxSXGYt_ymX"
    },
    {
        title: "Aaye Ho Meri Zindagi Mein",
        artist: "Bollywood",
        taal: "Dadra (6 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=ixCnsZswdpU"
    },
    {
        title: "Shri Ramchandra Kripalu Bhajamana",
        artist: "Devocional",
        taal: "Rupak (7 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=FqmMkDdpLdo"
    },
    {
        title: "Sharanagatam / Kisi Rah Par Kisi Mor Par",
        artist: "Bollywood",
        taal: "Rupak (7 beats)",
        youtubeUrl: "https://youtu.be/i88txA3Qpc8?si=kTHNn1ErPuyIHeEs"
    },
    {
        title: "Do Ghadi Baitho",
        artist: "Bollywood",
        taal: "Rupak (7 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=6R5DL4WQPSo"
    },
    {
        title: "Allah Tero Naam, Ishwar Tero Naam",
        artist: "Devocional",
        taal: "Rupak (7 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=f-ERhzkxgEs"
    },
    {
        title: "Sawan Ke Jhoole",
        artist: "Bollywood",
        taal: "Rupak (7 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=0VbyQ5tdavI"
    },
    {
        title: "Mere Humsafar",
        artist: "Bollywood",
        taal: "Rupak (7 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=TAUKxUfwvwA"
    },
    {
        title: "Megha Chhaye Aadhi Raat",
        artist: "Bollywood",
        taal: "Rupak (7 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=magUC0KJ1Uo"
    },
    {
        title: "O Basanti Pawan Pagal",
        artist: "Bollywood",
        taal: "Rupak (7 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=64EI8DGd2tQ"
    },
    {
        title: "Yeh Honsla Kaise Jhuke",
        artist: "Bollywood",
        taal: "Rupak (7 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=3TndEMf6zws"
    },
    {
        title: "Baat Nihare Ghanshyam",
        artist: "Devocional",
        taal: "Rupak (7 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=NwxrNK0nGZw"
    },
    {
        title: "Ghoomar",
        artist: "Bollywood",
        taal: "Keherwa (8 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=nHhRWgkkpMk"
    },
    {
        title: "Kehna Hi Kya",
        artist: "Bollywood",
        taal: "Keherwa (8 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=_YB1taxJPgk"
    },
    {
        title: "Roop Suhana Lagta Hai",
        artist: "Bollywood",
        taal: "Keherwa (8 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=DdO7VPfbgSg"
    },
    {
        title: "Aaja Sanam Madhur Chandni Mein Hum",
        artist: "Bollywood",
        taal: "Keherwa (8 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=msRBZuoerGo"
    },
    {
        title: "Sathiya Bin Tere Dil Mane Na",
        artist: "Bollywood",
        taal: "Keherwa (8 beats)",
        youtubeUrl: "https://youtu.be/oD0Dtk3YfZ8?si=IzPtmEsfY4e_Ihbj"
    },
    {
        title: "Pakhiyun Akhero Chadiyo",
        artist: "Devocional",
        taal: "Deepchandi (14 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=UoWMQimowm8"
    },
    {
        title: "Aji Rooth Kar Ab Kahan Jaiyega",
        artist: "Bollywood",
        taal: "Deepchandi (14 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=tbVKu36_4ZU"
    },
    {
        title: "Mera Jeevan Kora Kagaz / Dil Mein Ho Tasveer Teri",
        artist: "Bollywood",
        taal: "Deepchandi (14 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=vmDWt1skq24"
    },
    {
        title: "Aaj Kal Yaad Kuch Aur Rahata",
        artist: "Bollywood",
        taal: "Deepchandi (14 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=exAAEljV-68"
    },
    {
        title: "Tu Hain Toh",
        artist: "Bollywood",
        taal: "Deepchandi (14 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=TVbI55pDdaI"
    },
    {
        title: "Abhi Mujh Mein Kahin",
        artist: "Bollywood",
        taal: "Deepchandi (14 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=oWKgpB2zpgw"
    },
    {
        title: "Ae Mere Pyare Watan",
        artist: "Bollywood",
        taal: "Deepchandi (14 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=jDdlOoysg4s",
        notes: "Tutorial: https://www.youtube.com/shorts/b9MYUAMDurk"
    },
    {
        title: "Maula Mere Le Le Meri Jaan",
        artist: "Bollywood",
        taal: "Deepchandi (14 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=i_FmOdPF96E"
    },
    {
        title: "Piya Ghar Aavenge",
        artist: "Bollywood",
        taal: "Deepchandi (14 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=JSLHveDmdjY"
    },
    {
        title: "Abhi Na Jao Chhod Kar",
        artist: "Bollywood",
        taal: "Dadra (6 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=qRWozIldyDM"
    },
    {
        title: "Teri Bindiya Re",
        artist: "Bollywood",
        taal: "Rupak (7 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=DRaVzCwkl98"
    },
    {
        title: "Tere Mere Milan Ki Yeh Raina",
        artist: "Bollywood",
        taal: "Rupak (7 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=1Dlr6SG7Vm4"
    },
    {
        title: "Chupke Chupke Raat Din Aansoon Bahana Yaad Hai",
        artist: "Bollywood",
        taal: "Rupak (7 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=MWjaK_nW72E"
    },
    {
        title: "Thade Rahiyo O Baake Yaar Re",
        artist: "Bollywood",
        taal: "Dadra (6 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=cx_fHLQE97w"
    },
    {
        title: "Aap Ki Nazro Ne Samjha",
        artist: "Bollywood",
        taal: "Rupak (7 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=Wv-VlQMD0VY"
    },
    {
        title: "In Ankhon Ki Masti",
        artist: "Bollywood",
        taal: "Keherwa (8 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=pwsjRraWgdA"
    },
    {
        title: "Jab Deep Jale / Maan Hari Ke Gun Gaana",
        artist: "Devocional",
        taal: "Keherwa (8 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=ah1T5cTZmo8"
    },
    {
        title: "Aapne Yaad Dilaya Toh Mujhe / Swami Teoonram Vaña Toh Ta",
        artist: "Devocional",
        taal: "Keherwa (8 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=3E9y8BWQyXQ"
    },
    {
        title: "Madhuban Mein Radhika Nache Re",
        artist: "Bollywood",
        taal: "Teental (16 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=FtObMbpIJLQ"
    },
    {
        title: "Garaj Garaj",
        artist: "Bollywood",
        taal: "Ektal (12 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=CME-R5uz82w"
    },
    {
        title: "Jai Jai Jag Janani Devi",
        artist: "Devocional",
        taal: "Ektal (12 beats)",
        youtubeUrl: "https://www.youtube.com/watch?v=HWaz9aSKytc"
    }
];

// Made with ❤️ by Bob

// Made with Bob
