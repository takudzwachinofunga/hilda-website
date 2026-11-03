/**
 * ZimWatchline — demo content for previewing the design.
 *
 *   npm run db:demo            # add the demo events, articles and photographs
 *   npm run db:demo -- --clear # remove everything this script created
 *
 * WHAT THIS IS
 * The events, dates, venues and names below are real: they follow President
 * Emmerson Mnangagwa's 2026 public programme, from the World Governments Summit
 * in February to the Third Russia–Africa Summit at the end of October. The copy
 * was compiled on 3 November 2026 from public reporting and primary documents
 * (the COMESA final communiqué, the ZANU PF conference resolutions, The Herald,
 * ZBC, allAfrica, wire reporting and Wikipedia's 2026 Zimbabwe timeline).
 *
 * It is demonstration copy, not filed journalism. Every article ends with a note
 * saying so. Rewrite and re-verify anything before publishing it under a byline.
 *
 * PHOTOGRAPHS
 * Every picture is a real, freely licensed photograph from Wikimedia Commons —
 * the President himself where a free picture of him exists, and otherwise the
 * actual place or subject the story is about: the New Parliament Building at
 * Mount Hampden, the National Heroes Acre, the Matobo Hills, Masvingo farmland,
 * Chinhoyi, lithium-bearing ore from Bikita, the General Assembly Hall.
 *
 * Each caption says what the picture shows, when it was taken and who took it,
 * with the licence named, so an archive or stand-in frame is never passed off as
 * coverage of a later event. Nothing here is generic stock imagery. Swap any of
 * it for your own pictures through Admin → Media.
 *
 * Commons URLs are served as-is by the custom next/image loader
 * (src/lib/image-loader.ts), so no extra configuration is needed.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import slugify from "slugify";

import { commonsThumbnail } from "../src/lib/image-sources";

const db = process.env.TURSO_DATABASE_URL
  ? new PrismaClient({
      adapter: new PrismaLibSQL({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      }),
    })
  : new PrismaClient();

const COMMONS_HOST = "https://upload.wikimedia.org/wikipedia/commons/";
/** Host used by earlier versions of this script; still swept out by `clear()`. */
const LEGACY_PLACEHOLDER_HOST = "https://picsum.photos/";

const day = (iso: string) => new Date(`${iso}T12:00:00.000Z`);

// ─── Photograph registry ─────────────────────────────────────────────────────
// `subject` is the descriptive sentence shown to readers; the credit line is
// appended automatically. Keep subjects free of double quotes — they are written
// into HTML attributes for inline figures.

type Photo = {
  /** Path under COMMONS_HOST. */
  file: string;
  w: number;
  h: number;
  /** Short title for the media library. */
  title: string;
  /** What the picture shows. Ends with a full stop. */
  subject: string;
  credit: string;
  lic: string;
  takenAt: Date | null;
  place: string | null;
  video?: true;
};

const PHOTOS = {
  // ── The President ──
  "putin-mnangagwa-2026": {
    file: "2/21/Vladimir_Putin_and_Emmerson_Mnangagwa_at_the_Third_Russia-Africa_Summit_%28October_2026%29.jpg",
    w: 1880,
    h: 1160,
    title: "Mnangagwa and Putin, Third Russia–Africa Summit",
    subject:
      "President Mnangagwa with President Vladimir Putin before a gala reception for participants in the Third Russia–Africa Summit, Moscow, 28 October 2026.",
    credit: "Russian Presidential Executive Office",
    lic: "CC BY 4.0",
    takenAt: day("2026-10-28"),
    place: "Moscow, Russia",
  },
  "mnangagwa-ticad9": {
    file: "6/62/Group_photo_at_TICAD_9.jpg",
    w: 2600,
    h: 1645,
    title: "Leaders' group photograph, TICAD 9",
    subject:
      "Archive: the leaders' group photograph at the Ninth Tokyo International Conference on African Development, Yokohama, 20 August 2025.",
    credit: "Cabinet Public Relations Office, Cabinet Secretariat of Japan",
    lic: "CC BY 4.0",
    takenAt: day("2025-08-20"),
    place: "Yokohama, Japan",
  },
  "mnangagwa-boko": {
    file: "1/13/Duma_Boko_and_Emmerson_Mnangagwa_on_December_13%2C_2024.jpg",
    w: 1597,
    h: 898,
    title: "With President Duma Boko of Botswana",
    subject:
      "Archive: President Mnangagwa with President Duma Boko of Botswana, 13 December 2024.",
    credit: "Mqondisi Dube / VOA, public domain",
    lic: "public domain",
    takenAt: day("2024-12-13"),
    place: null,
  },
  "mnangagwa-usafrica": {
    file: "3/31/Emmerson_Mnangagwa_at_US-Africa_Business_Summit%2C_2023.jpg",
    w: 1597,
    h: 898,
    title: "At the US–Africa Business Summit",
    subject: "Archive: the President at the US–Africa Business Summit, 12 July 2023.",
    credit: "Mqondisi Dube / VOA, public domain",
    lic: "public domain",
    takenAt: day("2023-07-12"),
    place: null,
  },
  "mnangagwa-kremlin-2019": {
    file: "3/3b/Emmerson_Mnangagwa_at_the_Kremlin_%282019-01-15%29.jpg",
    w: 1880,
    h: 1160,
    title: "At the Kremlin, January 2019",
    subject:
      "Archive: the President at the Kremlin during his January 2019 official visit to Moscow, 15 January 2019.",
    credit: "Presidential Executive Office of Russia",
    lic: "CC BY 4.0",
    takenAt: day("2019-01-15"),
    place: "Moscow, Russia",
  },
  "mnangagwa-voa2017": {
    file: "3/37/Emmerson_Mnangagwa_2017.png",
    w: 1211,
    h: 1582,
    title: "Portrait, November 2017",
    subject:
      "Archive: portrait taken around the President's inauguration, 24 November 2017.",
    credit: "Voice of America, public domain",
    lic: "public domain",
    takenAt: day("2017-11-24"),
    place: "Harare",
  },
  "mnangagwa-headlands": {
    file: "4/40/Mnangagwa_Speaking_at_Headlands.jpg",
    w: 681,
    h: 623,
    title: "Speaking at Headlands, 2015",
    subject:
      "Archive: addressing a gathering at Headlands, Manicaland, 4 June 2015, while Vice-President.",
    credit: "Zimbabwe HOPE TV",
    lic: "CC BY 3.0",
    takenAt: day("2015-06-04"),
    place: "Headlands, Manicaland",
  },
  "mnangagwa-minsk-video": {
    file: "0/04/%D0%9B%D1%83%D0%BA%D0%B0%D1%88%D0%B5%D0%BD%D0%BA%D0%BE_%D0%BD%D0%B0%D0%B7%D0%B2%D0%B0%D0%BB_%D0%BF%D0%BB%D0%BE%D0%B4%D0%BE%D1%82%D0%B2%D0%BE%D1%80%D0%BD%D1%8B%D0%BC%D0%B8_%D0%BF%D0%B5%D1%80%D0%B5%D0%B3%D0%BE%D0%B2%D0%BE%D1%80%D1%8B_%D1%81_%D0%9F%D1%80%D0%B5%D0%B7%D0%B8%D0%B4%D0%B5%D0%BD%D1%82%D0%BE%D0%BC_%D0%97%D0%B8%D0%BC%D0%B1%D0%B0%D0%B1%D0%B2%D0%B5.webm",
    w: 1920,
    h: 1080,
    title: "Archive video: Minsk talks, January 2019",
    subject:
      "Archive footage (Russian language) of the President's talks in Minsk, 17 January 2019. Included to demonstrate the video player — swap in your own clip.",
    credit: "BelTA news agency",
    lic: "CC BY 3.0",
    takenAt: day("2019-01-17"),
    place: "Minsk, Belarus",
    video: true,
  },

  // ── Harare and the new Parliament ──
  // Note: Commons also has a 2424x1802 PNG of this building, but PNG thumbnails
  // weigh 1.6MB+ at hero sizes against ~230KB for this JPEG of the same subject.
  "parliament-mt-hampden": {
    file: "3/39/New_Parliament_of_Zimbabwe_August_2024.jpg",
    w: 1280,
    h: 960,
    title: "New Parliament Building, Mount Hampden",
    subject:
      "The New Parliament Building at Mount Hampden, Harare, where the 25th COMESA Summit was held, photographed in August 2024.",
    credit: "Mangwanani",
    lic: "CC0",
    takenAt: day("2024-08-12"),
    place: "Mount Hampden, Harare",
  },
  "harare-city": {
    file: "3/3e/Harare_movers_and_shakers.jpg",
    w: 4000,
    h: 3000,
    title: "Central Harare",
    subject: "Traffic and tower blocks in central Harare.",
    credit: "Brandon Mushori",
    lic: "CC BY-SA 4.0",
    takenAt: day("2020-02-05"),
    place: "Harare",
  },
  "harare-market": {
    file: "5/5d/Harare%2C_Zimbabwe._05.JPG",
    w: 4000,
    h: 3000,
    title: "A market in Harare",
    subject: "A market in Harare.",
    credit: "Suesen",
    lic: "CC BY-SA 3.0",
    takenAt: day("2013-12-24"),
    place: "Harare",
  },
  "harare-vendors": {
    file: "0/06/Carts_loaded_with_fruits_and_vegetables_for_sale_in_Harare.jpg",
    w: 3264,
    h: 2448,
    title: "Vendors in Harare",
    subject: "Carts loaded with fruit and vegetables for sale in Harare.",
    credit: "Cecil Dzwowa",
    lic: "CC BY-SA 4.0",
    takenAt: day("2016-10-14"),
    place: "Harare",
  },

  // ── National Heroes Acre ──
  "heroes-acre-obelisk": {
    file: "f/f0/Harare_-_Harare3510.jpg",
    w: 3888,
    h: 5184,
    title: "The obelisk at the National Heroes Acre",
    subject:
      "The granite obelisk and ceremonial staircase at the National Heroes Acre, Harare.",
    credit: "lumoplank",
    lic: "CC0",
    takenAt: null,
    place: "National Heroes Acre, Harare",
  },
  "heroes-acre-soldier": {
    file: "5/56/Nationalhelden-Denkmal_%2825281970147%29.jpg",
    w: 4032,
    h: 3024,
    title: "Statue of the Unknown Soldier",
    subject:
      "The Statue of the Unknown Soldier at the National Heroes Acre, Harare, photographed in February 2018.",
    credit: "ilf_",
    lic: "CC BY-SA 2.0",
    takenAt: day("2018-02-08"),
    place: "National Heroes Acre, Harare",
  },
  "heroes-acre-wide": {
    file: "e/e2/Nationalhelden-Denkmal_%2840153835081%29.jpg",
    w: 4032,
    h: 3024,
    title: "The National Heroes Acre",
    subject: "The National Heroes Acre, Harare, photographed in February 2018.",
    credit: "ilf_",
    lic: "CC BY-SA 2.0",
    takenAt: day("2018-02-08"),
    place: "National Heroes Acre, Harare",
  },
  "heroes-acre-steps": {
    file: "5/57/Heroes_Acre%2C_Harare%2C_Zimbabwe_%281%29.jpg",
    w: 2048,
    h: 1536,
    title: "National Heroes Acre, 2003",
    subject: "The National Heroes Acre, Harare, photographed in March 2003.",
    credit: "Gary Bembridge",
    lic: "CC BY 2.0",
    takenAt: day("2003-03-01"),
    place: "National Heroes Acre, Harare",
  },

  // ── Matabeleland South and national symbols ──
  "matobo-hills": {
    file: "6/6b/Intunjambili_Cave_Matobo_2.jpg",
    w: 4608,
    h: 3456,
    title: "The Matobo Hills",
    subject:
      "The Matobo Hills in Matabeleland South, the district that hosted the 2026 Independence Day celebrations.",
    credit: "SpiderFitz",
    lic: "CC BY-SA 4.0",
    takenAt: day("2018-02-25"),
    place: "Matobo District, Matabeleland South",
  },
  "matobo-cave": {
    file: "9/9c/Intunjambili_Cave%2C_Matobo.jpg",
    w: 4608,
    h: 3456,
    title: "Intunjambili Cave, Matobo",
    subject:
      "Intunjambili Cave, a sacred rainmaking shrine in the Matobo Hills, Matabeleland South.",
    credit: "SpiderFitz",
    lic: "CC BY-SA 4.0",
    takenAt: day("2018-02-25"),
    place: "Matobo District, Matabeleland South",
  },
  "zimbabwe-bird-flag": {
    file: "3/3a/Close_up_of_the_Zimbabwe_Bird_on_a_flag_manufactured_in_Zimbabwe.jpg",
    w: 2617,
    h: 3758,
    title: "The Zimbabwe Bird",
    subject: "The Zimbabwe Bird on a national flag manufactured in Zimbabwe.",
    credit: "Bruce Berry",
    lic: "CC0",
    takenAt: day("2016-01-23"),
    place: "Zimbabwe",
  },
  "flag-beads": {
    file: "b/be/Zimbabwean_Flag_in_Beads.jpg",
    w: 4160,
    h: 3120,
    title: "The national flag in beadwork",
    subject: "The Zimbabwean flag worked in beads.",
    credit: "Siphetha",
    lic: "CC0",
    takenAt: day("2024-04-05"),
    place: "Zimbabwe",
  },

  // ── Farming and the season ──
  "masvingo-farm-1": {
    file: "6/61/Masvingo_Wiki_Loves_Africa_2025_in_Zimbabwe_Masvingo_01.jpg",
    w: 5184,
    h: 3888,
    title: "Farmland in Masvingo",
    subject: "Farmland in Masvingo Province, photographed in April 2025.",
    credit: "Hope A Ncube",
    lic: "CC BY-SA 4.0",
    takenAt: day("2025-04-12"),
    place: "Masvingo Province",
  },
  "masvingo-farm-2": {
    file: "9/90/Masvingo_Wiki_Loves_Africa_2025_in_Zimbabwe_Masvingo_04.jpg",
    w: 5184,
    h: 3888,
    title: "Farming in Masvingo",
    subject: "Farming in Masvingo Province, photographed in April 2025.",
    credit: "Hope A Ncube",
    lic: "CC BY-SA 4.0",
    takenAt: day("2025-04-12"),
    place: "Masvingo Province",
  },
  "maize-cobs": {
    file: "7/78/Measuring_the_maize_cobs_after_cropping_%285568156504%29.jpg",
    w: 2592,
    h: 1944,
    title: "Measuring maize cobs after harvest",
    subject:
      "Measuring maize cobs after harvest in a field trial at Epworth, Zimbabwe, April 2009.",
    credit: "SuSanA Secretariat",
    lic: "CC BY 2.0",
    takenAt: day("2009-04-16"),
    place: "Epworth, Zimbabwe",
  },
  "cashel-beans": {
    file: "7/74/Farming_Beans_At_Cashel_Valley%2C_Zimbabwe.jpg",
    w: 3000,
    h: 4000,
    title: "Bean farming, Cashel Valley",
    subject: "Bean farming in the Cashel Valley, Manicaland, April 2025.",
    credit: "Look4Faith",
    lic: "CC BY-SA 4.0",
    takenAt: day("2025-04-26"),
    place: "Cashel Valley, Manicaland",
  },
  "ebenezer-farm": {
    file: "9/9c/Bulawayo_Wikimedian_Ebenezar_Farm_Visit_April_2025_%287%29.jpg",
    w: 4032,
    h: 3024,
    title: "A farm outside Bulawayo",
    subject: "A farm outside Bulawayo, photographed in April 2025.",
    credit: "Russellmashinya",
    lic: "CC BY-SA 4.0",
    takenAt: day("2025-04-26"),
    place: "Bulawayo",
  },
  "drought-sentinel": {
    file: "1/10/Severe_drought_in_Zimbabwe_affects_agriculture_and_food_security_%28P-064296-00-23%29.jpg",
    w: 3508,
    h: 4961,
    title: "Satellite view of drought in Zimbabwe",
    subject:
      "Copernicus Sentinel-2 imagery of the El Niño-induced drought in Zimbabwe, 27 August 2024. Subsistence agriculture supports around 70 percent of the population.",
    credit: "Copernicus Sentinel-2 imagery, European Union",
    lic: "CC BY 4.0",
    takenAt: day("2024-08-27"),
    place: "Zimbabwe",
  },

  // ── Mashonaland West ──
  "chinhoyi-morning": {
    file: "9/95/One_foggy_morning_in_Chinhoyi%2C_Zimbabwe.jpg",
    w: 4480,
    h: 2016,
    title: "Morning in Chinhoyi",
    subject:
      "A foggy morning in Chinhoyi, Mashonaland West, the town that hosted the 23rd ZANU PF conference.",
    credit: "Onlam",
    lic: "CC BY-SA 4.0",
    takenAt: day("2023-03-09"),
    place: "Chinhoyi, Mashonaland West",
  },
  "chinhoyi-caves": {
    file: "b/b0/Chinhoyi_caves%2C_Zimbabwe.JPG",
    w: 4000,
    h: 3000,
    title: "The Chinhoyi Caves",
    subject: "The Chinhoyi Caves, Mashonaland West.",
    credit: "Suesen",
    lic: "CC BY-SA 3.0",
    takenAt: day("2014-01-06"),
    place: "Chinhoyi, Mashonaland West",
  },

  // ── Minerals ──
  "bikita-lithium": {
    file: "b/b1/Bikitait.jpg",
    w: 5118,
    h: 3412,
    title: "Lithium-bearing ore from Bikita",
    subject:
      "Bikitaite, eucryptite and lepidolite — lithium-bearing minerals from Bikita, Masvingo Province.",
    credit: "Kaethe17",
    lic: "CC BY-SA 4.0",
    takenAt: day("2023-03-12"),
    place: "Bikita, Masvingo Province",
  },
  "artisanal-miners": {
    file: "e/e0/20230329_131225jpg.jpg",
    w: 4160,
    h: 3120,
    title: "Artisanal miners",
    subject: "Artisanal miners at work in Zimbabwe, March 2023.",
    credit: "Siphetha",
    lic: "CC BY-SA 4.0",
    takenAt: day("2023-03-29"),
    place: "Zimbabwe",
  },
  "artisanal-mine": {
    file: "d/d2/20230329_125951jpg.jpg",
    w: 4160,
    h: 3120,
    title: "An artisanal mining site",
    subject: "An artisanal mining site in Zimbabwe, March 2023.",
    credit: "Siphetha",
    lic: "CC BY-SA 4.0",
    takenAt: day("2023-03-29"),
    place: "Zimbabwe",
  },
  "victoria-falls": {
    file: "0/0b/Victoria_Falls%2C_Zimbabwe_%2848594275221%29.jpg",
    w: 4608,
    h: 2592,
    title: "Victoria Falls",
    subject: "Victoria Falls, photographed from the Zimbabwean side in August 2019.",
    credit: "Fabio Achilli",
    lic: "CC BY 2.0",
    takenAt: day("2019-08-14"),
    place: "Victoria Falls",
  },

  // ── Regional leaders and venues ──
  hichilema: {
    file: "0/04/Second_inauguration_of_Hakainde_Hichilema_03.jpg",
    w: 4080,
    h: 3072,
    title: "President Hakainde Hichilema of Zambia",
    subject:
      "President Hakainde Hichilema of Zambia, elected COMESA Vice-Chairperson at Harare, pictured at his second inauguration in Lusaka on 31 August 2026.",
    credit: "Icem4k",
    lic: "CC BY-SA 4.0",
    takenAt: day("2026-08-31"),
    place: "Lusaka, Zambia",
  },
  ruto: {
    file: "e/e0/Visit_of_William_Ruto%2C_President_of_Kenya%2C_to_the_EC_%28P-069944-00-11%29.jpg",
    w: 6000,
    h: 4000,
    title: "President William Ruto of Kenya",
    subject:
      "President William Ruto of Kenya, who handed the COMESA chair to Zimbabwe, on an earlier visit to the European Commission.",
    credit: "European Commission audiovisual service",
    lic: "CC BY 4.0",
    takenAt: null,
    place: null,
  },
  ramaphosa: {
    file: "4/47/Cyril_Ramaphosa_%2830723014148%29.jpg",
    w: 5760,
    h: 3840,
    title: "President Cyril Ramaphosa of South Africa",
    subject: "President Cyril Ramaphosa of South Africa, photographed in September 2018.",
    credit: "ITU Pictures",
    lic: "CC BY 2.0",
    takenAt: day("2018-09-10"),
    place: null,
  },
  mswati: {
    file: "d/d8/Taiwan_President_Lai_Ching-te_and_King_of_Eswatini%2C_Mswati_III_20260503.jpg",
    w: 3000,
    h: 1935,
    title: "King Mswati III of Eswatini",
    subject: "King Mswati III of Eswatini, pictured in May 2026.",
    credit: "Office of the President, Republic of China (Taiwan)",
    lic: "CC BY 4.0",
    takenAt: day("2026-05-02"),
    place: null,
  },
  "mswati-airport": {
    file: "c/c8/King_Mswati_III_International_Airport_-_Terminal.jpg",
    w: 5184,
    h: 3456,
    title: "King Mswati III International Airport",
    subject: "The terminal at King Mswati III International Airport, Eswatini.",
    credit: "KrasseChecker",
    lic: "CC BY-SA 3.0",
    takenAt: day("2015-10-27"),
    place: "Eswatini",
  },
  "durban-centre": {
    file: "0/0c/Durban_City_Centre.jpg",
    w: 4319,
    h: 3229,
    title: "Central Durban",
    subject: "Central Durban, KwaZulu-Natal, host city of the 46th SADC Summit.",
    credit: "Khethukuthula Happyson Mbonambi",
    lic: "CC BY-SA 4.0",
    takenAt: day("2014-01-30"),
    place: "Durban, South Africa",
  },
  "durban-air": {
    file: "d/df/Durban_from_the_air.jpg",
    w: 3648,
    h: 2736,
    title: "Durban from the air",
    subject: "Durban from the air, looking inland.",
    credit: "Esther Dyson",
    lic: "CC BY 2.0",
    takenAt: day("2007-08-24"),
    place: "Durban, South Africa",
  },
  "durban-harbour": {
    file: "6/67/Durban_Harbour.jpg",
    w: 3251,
    h: 2438,
    title: "Durban harbour",
    subject: "Durban harbour, the busiest container port in southern Africa.",
    credit: "Nzukiso Jalubani",
    lic: "CC BY-SA 4.0",
    takenAt: day("2019-05-15"),
    place: "Durban, South Africa",
  },
  "union-buildings": {
    file: "e/ec/Union_Buildings_Pretoria_015.jpg",
    w: 4608,
    h: 3072,
    title: "The Union Buildings, Pretoria",
    subject: "The Union Buildings in Pretoria, seat of the South African presidency.",
    credit: "PHParsons",
    lic: "CC BY-SA 3.0",
    takenAt: day("2013-08-04"),
    place: "Pretoria, South Africa",
  },
  "union-buildings-2": {
    file: "3/33/Union_Buildings_Pretoria_009.jpg",
    w: 3072,
    h: 4608,
    title: "The Union Buildings",
    subject: "The Union Buildings, Pretoria.",
    credit: "PHParsons",
    lic: "CC BY-SA 3.0",
    takenAt: day("2013-08-04"),
    place: "Pretoria, South Africa",
  },
  "unga-hall": {
    file: "b/bb/United_Nations_General_Assembly_Hall_%282%29.jpg",
    w: 5184,
    h: 3456,
    title: "The General Assembly Hall",
    subject: "The General Assembly Hall at United Nations headquarters in New York.",
    credit: "Basil D Soufi",
    lic: "CC BY-SA 3.0",
    takenAt: day("2011-04-23"),
    place: "New York, United States",
  },
  "unga-hall-2": {
    file: "e/e8/United_Nations_General_Assembly_Hall_%283%29.jpg",
    w: 5184,
    h: 3456,
    title: "The General Assembly Hall, interior",
    subject: "The General Assembly Hall, United Nations headquarters, New York.",
    credit: "Basil D Soufi",
    lic: "CC BY-SA 3.0",
    takenAt: day("2011-04-23"),
    place: "New York, United States",
  },
  "un-emblem": {
    file: "a/ae/United_Nations_General_Assembly_Hall_-_Closeup_of_Emblem.jpg",
    w: 5184,
    h: 3456,
    title: "The United Nations emblem",
    subject:
      "The United Nations emblem above the rostrum in the General Assembly Hall, New York.",
    credit: "Basil D Soufi",
    lic: "CC BY-SA 3.0",
    takenAt: day("2011-04-23"),
    place: "New York, United States",
  },
  "wgs-dubai": {
    file: "1/18/Faisal_Naseem_attends_the_World_Government_Summit_2022_04.jpg",
    w: 5568,
    h: 3712,
    title: "The World Government Summit, Dubai",
    subject:
      "A session at the World Government Summit in Dubai, photographed at the 2022 edition.",
    credit: "The President's Office, Maldives",
    lic: "CC BY 4.0",
    takenAt: day("2022-03-29"),
    place: "Dubai, United Arab Emirates",
  },
  "wgs-dubai-2": {
    file: "e/ef/A_Chat_between_Mohammad_Al_Gergawi_and_Klaus_Schwab_during_World_Government_Summit.jpg",
    w: 5691,
    h: 4000,
    title: "On stage at the World Government Summit",
    subject:
      "On stage at the World Government Summit in Dubai, photographed at the 2019 edition.",
    credit: "JoohnSmith41",
    lic: "CC BY-SA 4.0",
    takenAt: day("2019-02-09"),
    place: "Dubai, United Arab Emirates",
  },
  "accra-city": {
    file: "f/fb/Accra_city_1.jpg",
    w: 4284,
    h: 5712,
    title: "Accra",
    subject: "Accra, the Ghanaian capital, where the President made a State Visit in April.",
    credit: "Cca Raheem",
    lic: "CC BY 4.0",
    takenAt: day("2025-12-24"),
    place: "Accra, Ghana",
  },
  "accra-airport-city": {
    file: "6/6b/Airport_City%2C_Accra_Ghana.jpg",
    w: 5664,
    h: 4248,
    title: "Airport City, Accra",
    subject: "Airport City, Accra.",
    credit: "Fanti Salms",
    lic: "CC BY-SA 4.0",
    takenAt: day("2022-08-06"),
    place: "Accra, Ghana",
  },
  "luanda-bay": {
    file: "5/51/Luanda_Bay_-_panoramio.jpg",
    w: 6000,
    h: 4000,
    title: "Luanda Bay",
    subject: "Luanda Bay, Angola, where the Global Tourism Forum investment summit was held.",
    credit: "---=XEON=---",
    lic: "CC BY 3.0",
    takenAt: null,
    place: "Luanda, Angola",
  },
  "luanda-city": {
    file: "a/a3/Luanda_city_-_panoramio.jpg",
    w: 6000,
    h: 4000,
    title: "Luanda",
    subject: "The city of Luanda, Angola.",
    credit: "---=XEON=---",
    lic: "CC BY 3.0",
    takenAt: null,
    place: "Luanda, Angola",
  },
  "kremlin-palace": {
    file: "c/c8/Moscow._Grand_Kremlin_Palace_from_the_Bolshoy_Kamenny_Bridge.jpg",
    w: 8040,
    h: 5504,
    title: "The Grand Kremlin Palace",
    subject: "The Grand Kremlin Palace, Moscow, seen from the Bolshoy Kamenny Bridge.",
    credit: "Юрий Д.К.",
    lic: "CC BY 4.0",
    takenAt: null,
    place: "Moscow, Russia",
  },
  "kremlin-view": {
    file: "5/5a/Moscow._View_of_the_Kremlin_in_September2.jpg",
    w: 8256,
    h: 5504,
    title: "The Kremlin",
    subject: "A view of the Moscow Kremlin in September.",
    credit: "Юрий Д.К.",
    lic: "CC BY 4.0",
    takenAt: null,
    place: "Moscow, Russia",
  },
} as const satisfies Record<string, Photo>;

type PhotoId = keyof typeof PHOTOS;

const photoUrl = (id: PhotoId) => `${COMMONS_HOST}${PHOTOS[id].file}`;

/** Full caption: what it shows, then who took it and under what licence. */
const photoCaption = (id: PhotoId) => {
  const p = PHOTOS[id];
  const credit = p.lic === "public domain" ? p.credit : `${p.credit} (${p.lic})`;
  return `${p.subject} Photo: ${credit} via Wikimedia Commons.`;
};

/**
 * Widths baked into stored fields. Everything rendered through next/image resizes
 * itself via the custom loader, but article HTML and the stored thumbnail are
 * plain URLs, so they carry a sensible size of their own rather than the original:
 * prose is never wider than ~960px and grid tiles never wider than ~500px.
 */
const INLINE_WIDTH = 960;
const THUMB_WIDTH = 500;

const sized = (id: PhotoId, width: number) =>
  commonsThumbnail(photoUrl(id), width) ?? photoUrl(id);

// ─── Events: the 2026 presidential diary ─────────────────────────────────────

const EVENTS = [
  {
    slug: "world-governments-summit-dubai-2026",
    title: "World Governments Summit 2026",
    location: "Dubai, United Arab Emirates",
    startDate: day("2026-02-01"),
    endDate: day("2026-02-05"),
    description:
      "The President travelled to Dubai for the World Governments Summit, joining a high-level panel on Africa's future alongside the Presidents of Botswana and Sierra Leone. The trip was framed at home as part of Zimbabwe's re-engagement drive.",
    gallery: ["wgs-dubai", "wgs-dubai-2"],
  },
  {
    slug: "state-visit-ghana-accra-2026",
    title: "State Visit to Ghana",
    location: "Accra, Ghana",
    startDate: day("2026-04-01"),
    endDate: day("2026-04-03"),
    description:
      "A three-day State Visit to Accra that closed with eleven agreements — ten government-to-government memoranda and one private sector deal — and a tour of the Sweden Ghana Medical Centre.",
    gallery: ["accra-city", "accra-airport-city"],
  },
  {
    slug: "independence-day-2026-maphisa",
    title: "Zimbabwe at 46: Independence Day Celebrations",
    location: "Maphisa, Matobo District, Matabeleland South",
    startDate: day("2026-04-18"),
    endDate: null,
    description:
      "The forty-sixth Independence Day, held at Maphisa under the theme “Zim@46 – Unity and Development Towards Vision 2030”. Matabeleland South's turn in the rotation that has moved the main celebrations around the provinces since 2021.",
    gallery: ["matobo-hills", "matobo-cave", "zimbabwe-bird-flag", "flag-beads"],
  },
  {
    slug: "eswatini-double-celebration-2026",
    title: "King Mswati III Double Celebration",
    location: "Lobamba, Eswatini",
    startDate: day("2026-04-26"),
    endDate: day("2026-04-27"),
    description:
      "A working visit to Lobamba for the twin commemoration of King Mswati III's 58th birthday and the 40th anniversary of his reign.",
    gallery: ["mswati", "mswati-airport"],
  },
  {
    slug: "global-tourism-forum-luanda-2026",
    title: "Global Tourism Forum Angola Investment Summit",
    location: "Luanda, Angola",
    startDate: day("2026-06-17"),
    endDate: day("2026-06-19"),
    description:
      "The President attended as a distinguished guest at a summit on tourism-led economic development, investment and regional cooperation.",
    gallery: ["luanda-bay", "luanda-city"],
  },
  {
    slug: "heroes-day-2026-national-heroes-acre",
    title: "46th Heroes' Day and Defence Forces Day",
    location: "National Heroes Acre, Harare",
    startDate: day("2026-08-10"),
    endDate: day("2026-08-11"),
    description:
      "The annual commemoration at the National Heroes Acre on 10 August, followed by Defence Forces Day on 11 August.",
    gallery: ["heroes-acre-obelisk", "heroes-acre-soldier", "heroes-acre-wide", "heroes-acre-steps"],
  },
  {
    slug: "sadc-46th-summit-durban-2026",
    title: "46th SADC Summit of Heads of State and Government",
    location: "Durban, South Africa",
    startDate: day("2026-08-16"),
    endDate: day("2026-08-17"),
    description:
      "The Southern African Development Community's annual summit, two months before Zimbabwe took the COMESA chair.",
    gallery: ["durban-centre", "durban-air", "durban-harbour"],
  },
  {
    slug: "sa-zimbabwe-bi-national-commission-2026",
    title: "Fourth Session of the South Africa–Zimbabwe Bi-National Commission",
    location: "Pretoria, South Africa",
    startDate: day("2026-08-21"),
    endDate: null,
    description:
      "The President met President Cyril Ramaphosa in Pretoria for the fourth session of the two countries' Bi-National Commission.",
    gallery: ["union-buildings", "union-buildings-2", "ramaphosa"],
  },
  {
    slug: "unga-81st-session-new-york-2026",
    title: "81st Session of the United Nations General Assembly",
    location: "New York, United States",
    startDate: day("2026-09-19"),
    endDate: day("2026-09-25"),
    description:
      "A week in New York for the General Debate, alongside a Zimbabwe Business Forum on unlocking financing for key sectors — Zimbabwe's first General Assembly since winning a rotating Security Council seat in June.",
    gallery: ["unga-hall", "unga-hall-2", "un-emblem"],
  },
  {
    slug: "pfumvudza-intwasa-launch-2026-27",
    title: "2026/27 National Pfumvudza/Intwasa Launch",
    location: "Shanduka Village, Chivi, Masvingo",
    startDate: day("2026-10-09"),
    endDate: day("2026-10-10"),
    description:
      "The launch of the Presidential Pfumvudza/Intwasa programme and summer inputs distribution for the 2026/27 season, with forecasters putting the odds of an El Niño at 88 to 94 percent.",
    gallery: [
      "masvingo-farm-1",
      "masvingo-farm-2",
      "maize-cobs",
      "cashel-beans",
      "ebenezer-farm",
      "drought-sentinel",
    ],
  },
  {
    slug: "zanu-pf-23rd-national-peoples-conference",
    title: "23rd ZANU PF National People's Conference",
    location: "Chinhoyi University of Technology, Mashonaland West",
    startDate: day("2026-10-16"),
    endDate: day("2026-10-17"),
    description:
      "Two days in Chinhoyi under the theme “From Resolutions to Results: Consolidating Economic Development and Deepening Empowerment towards Vision 2030”, closing with resolutions that moved the party's congress to 2029.",
    gallery: ["chinhoyi-morning", "chinhoyi-caves"],
  },
  {
    slug: "comesa-25th-summit-harare-2026",
    title: "25th COMESA Summit of Heads of State and Government",
    location: "New Parliament Building, Mount Hampden, Harare",
    startDate: day("2026-10-22"),
    endDate: null,
    description:
      "Zimbabwe hosted the twenty-fifth summit of the Common Market for Eastern and Southern Africa under the theme “One Market, One Future: Advancing Inclusive Industrialisation, Investment and Regional Integration in COMESA”, and took the chair of the 21-member bloc for a year.",
    gallery: ["parliament-mt-hampden", "harare-city", "harare-market", "hichilema", "ruto"],
  },
  {
    slug: "third-russia-africa-summit-moscow-2026",
    title: "Third Russia–Africa Summit",
    location: "Moscow, Russia",
    startDate: day("2026-10-28"),
    endDate: day("2026-10-29"),
    description:
      "Two days in Moscow under the theme “For Peace, Security and Development”, the President's first foreign trip as Chairperson of COMESA.",
    gallery: [
      "putin-mnangagwa-2026",
      "kremlin-palace",
      "kremlin-view",
      "mnangagwa-kremlin-2019",
    ],
  },
] as const satisfies readonly {
  slug: string;
  title: string;
  location: string;
  startDate: Date;
  endDate: Date | null;
  description: string;
  gallery: readonly PhotoId[];
}[];

type EventSlug = (typeof EVENTS)[number]["slug"];

/** Photographs not tied to one assignment: the archive the gallery draws on. */
const ARCHIVE: PhotoId[] = [
  "mnangagwa-ticad9",
  "mnangagwa-boko",
  "mnangagwa-usafrica",
  "mnangagwa-voa2017",
  "mnangagwa-headlands",
  "mnangagwa-minsk-video",
  "harare-vendors",
  "bikita-lithium",
  "artisanal-miners",
  "artisanal-mine",
  "victoria-falls",
];

// ─── Articles ────────────────────────────────────────────────────────────────

const para = (...sentences: string[]) => `<p>${sentences.join(" ")}</p>`;
const h2 = (text: string) => `<h2>${text}</h2>`;
const quote = (text: string, source: string) =>
  `<blockquote><p>${text}</p><p><em>— ${source}</em></p></blockquote>`;

/** Inline figure built from the registry, so the credit always travels with it. */
const fig = (id: PhotoId) => {
  const caption = photoCaption(id);
  const alt = PHOTOS[id].subject.replace(/\.$/, "");
  return `<figure data-type="figure"><img src="${sized(id, INLINE_WIDTH)}" alt="${alt}" data-caption="${caption}"><figcaption>${caption}</figcaption></figure>`;
};

const note = (sources: string) =>
  `<hr>${para(
    `<em>Demo copy, compiled 3 November 2026 from ${sources}. It is a starting point for layout, not filed reporting — verify, rewrite and re-photograph before publishing.</em>`,
  )}`;

const DRAFT_SLUG = "draft-constitutional-amendment-court-challenge";

type ArticleSeed = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  event: EventSlug | null;
  published: Date;
  tags: string[];
  lead: PhotoId;
  featured?: true;
  content: string;
};

const ARTICLES: ArticleSeed[] = [
  {
    slug: "mnangagwa-takes-comesa-chair-at-harare-summit",
    title: "Mnangagwa takes the COMESA chair as Harare summit turns on value addition",
    excerpt:
      "Elected by acclamation at Mount Hampden, the President takes a one-year turn at the head of a 21-member bloc that has put critical minerals and non-tariff barriers at the top of its list.",
    category: "diplomacy",
    event: "comesa-25th-summit-harare-2026",
    published: day("2026-10-22"),
    tags: ["COMESA", "Regional Integration", "Trade", "Mount Hampden"],
    lead: "parliament-mt-hampden",
    featured: true,
    content: [
      para(
        "President Emmerson Mnangagwa was elected by acclamation as Chairperson of the COMESA Authority at the bloc's twenty-fifth summit, held at the New Parliament Building in Mount Hampden on 22 October, taking over from Kenya's President William Ruto after Kenya's year in the chair.",
        "President Hakainde Hichilema of Zambia was elected Vice-Chairperson and President Ruto Rapporteur.",
      ),
      para(
        "The summit ran under the theme “One Market, One Future: Advancing Inclusive Industrialisation, Investment and Regional Integration in COMESA”. Mr Ruto called the meeting to order, delivered the keynote and launched the bloc's Medium-Term Strategic Plan for 2026 to 2030 together with its 2025 Annual Report before handing over.",
      ),
      h2("Who was in the room"),
      para(
        "Alongside the three presidents, the Authority seated Prime Minister Kamil Idriss of Sudan, Prime Minister Justin Nsengiyumva of Rwanda, Prime Minister Russell Dlamini of Eswatini, Prime Minister Nesto Ntahonyuye of Burundi and Deputy Prime Minister Salah Ahmed Jama of Somalia.",
        "Ministers and ambassadors represented Comoros, Djibouti, the Democratic Republic of Congo, Egypt, Ethiopia, Libya, Madagascar, Malawi, Mauritius, Seychelles, Tunisia and Uganda.",
      ),
      fig("hichilema"),
      para(
        "COMESA Secretary General Chileshe Mpundu Kapwepwe addressed the Authority, as did Wamkele Mene, Secretary General of the African Continental Free Trade Area. Claver Gatete, Executive Secretary of the UN Economic Commission for Africa, joined online.",
      ),
      h2("Raw exports in the frame"),
      para(
        "The language that will travel furthest from this summit is on minerals. The Authority recorded its unease about shipping the region's critical minerals out unprocessed in terms that leave little room for interpretation.",
      ),
      quote(
        "EXPRESSED CONCERN that the continued export of critical minerals in raw or minimally processed form limits opportunities for value addition, technology development, employment creation, fiscal revenue mobilization and the development of competitive downstream industries.",
        "Final Communiqué of the Twenty-Fifth COMESA Summit, Harare, 22 October 2026",
      ),
      para(
        "That is familiar ground for the host. Zimbabwe suspended exports of raw minerals and lithium concentrate in February, and the beneficiation argument has been the through-line of the President's public remarks on trade all year.",
      ),
      para("The twenty-sixth summit will be held in Addis Ababa, on a date still to be announced."),
      note(
        "the COMESA final communiqué of 26 October 2026, COMESA's own summit press release, The Herald and allAfrica",
      ),
    ].join(""),
  },
  {
    slug: "comesa-communique-non-tariff-barriers-digital-trade",
    title:
      "Communiqué: e-certificates in six states, a payments pilot, and five countries told to join the FTA",
    excerpt:
      "Past the headline handover, the Harare communiqué is a progress report on the plumbing of regional trade — electronic certificates of origin, an app for reporting border obstructions, and a cross-border payments pilot on the Malawi–Zambia corridor.",
    category: "economy",
    event: "comesa-25th-summit-harare-2026",
    published: day("2026-10-26"),
    tags: ["COMESA", "Trade", "Cross-border Traders", "Critical Minerals"],
    lead: "harare-city",
    content: [
      para(
        "The final communiqué of the twenty-fifth COMESA summit, released on 26 October, runs to ten pages and is more useful than the handover photographs for anyone trying to work out what the bloc actually does.",
      ),
      h2("The Free Trade Area"),
      para(
        "The Authority called on the Democratic Republic of Congo, Eritrea, Eswatini, Ethiopia and Somalia to expedite accession to the COMESA Free Trade Area, and urged member states to keep safeguard measures and other restrictions on intra-COMESA trade consistent with the Treaty.",
      ),
      para(
        "On the practical side it commended the rollout of the Electronic Certificate of Origin in six member states, the strengthening of the online non-tariff barriers reporting mechanism, and the introduction of a COMESA NTBs app and SMS platform aimed at small-scale cross-border traders. Member states were urged to extend the Simplified Trade Regime to more border crossings.",
      ),
      fig("harare-vendors"),
      h2("Payments"),
      para(
        "The communiqué pressed for wider use of the COMESA Regional Payment and Settlement System to settle cross-border transactions in local currencies and ease pressure on foreign exchange reserves. It also noted progress on a Digital Retail Payment Platform following pilot testing along the Malawi–Zambia corridor.",
      ),
      h2("Food, health and movement"),
      para(
        "The Regional Food Balance Sheet is now operational in ten member states and covers seven staple crops, with earth observation data and a mobile app for smallholders folded in.",
        "The Authority urged states to operationalise the COMESA Business Visa and to accelerate ratification of the Protocol on Free Movement of Persons.",
      ),
      para(
        "It also congratulated President Hichilema for presenting the title deed to 14 hectares in Lusaka's Airport City for a new COMESA headquarters, and recorded that an EPC contract has been signed with CSCEC.",
      ),
      note("the COMESA final communiqué of 26 October 2026"),
    ].join(""),
  },
  {
    slug: "comesa-business-forum-and-exhibition-harare",
    title: "Before the leaders: a week of council meetings, a business forum and an exhibition",
    excerpt:
      "The summit day is the short part. Harare spent the preceding week hosting senior officials, the 46th Council of Ministers, foreign ministers and a business forum.",
    category: "economy",
    event: "comesa-25th-summit-harare-2026",
    published: day("2026-10-21"),
    tags: ["COMESA", "Trade", "Harare"],
    lead: "harare-market",
    content: [
      para(
        "By the time heads of state sat down at Mount Hampden on 22 October, the substantive work had largely been done. The summit was preceded by meetings of senior officials, the 46th Meeting of the COMESA Council of Ministers and the twenty-first meeting of COMESA Ministers of Foreign Affairs, whose reports the Authority went on to adopt.",
      ),
      para(
        "A COMESA Business Forum and an accompanying exhibition ran alongside the official programme, with around a thousand delegates expected in the capital across the week.",
      ),
      fig("ruto"),
      para(
        "Development partners in attendance included the African Development Bank, the World Bank, the European Union, the UK's Foreign, Commonwealth and Development Office, UN agencies, TradeMark Africa, AGRA, FANRPAN and CABI.",
      ),
      note("COMESA press releases, the summit communiqué and The Herald"),
    ].join(""),
  },
  {
    slug: "president-in-moscow-for-third-russia-africa-summit",
    title: "President in Moscow for the Third Russia–Africa Summit",
    excerpt:
      "His first trip abroad as COMESA chairperson took him to a two-day summit under the theme “For Peace, Security and Development”, with one-on-one talks with President Putin on the schedule.",
    category: "official-visits",
    event: "third-russia-africa-summit-moscow-2026",
    published: day("2026-10-28"),
    tags: ["Russia", "COMESA", "Economic Diplomacy", "Moscow"],
    lead: "putin-mnangagwa-2026",
    content: [
      para(
        "President Mnangagwa led Zimbabwe's delegation to the Third Russia–Africa Summit in Moscow on 28 and 29 October, six days after taking the chair of COMESA. Foreign Affairs Minister Amon Murwira had confirmed ahead of the trip that the President would head the delegation personally.",
      ),
      para(
        "He attended in his capacity as Chairperson of the Common Market for Eastern and Southern Africa, which put regional trade and economic integration at the centre of his engagements rather than Zimbabwe's bilateral file alone.",
      ),
      h2("The programme"),
      para(
        "The published schedule had one-on-one talks with President Vladimir Putin, meetings with Russian business leaders, and a meeting with Zimbabweans living in Russia. The summit ran under the theme “For Peace, Security and Development”.",
      ),
      fig("kremlin-palace"),
      para(
        "Accounts of attendance varied: one report put twenty-two African heads of state in Moscow, another around twenty out of forty-eight countries represented at some level.",
      ),
      note("Zimbabwean state and private media, Voice of Nigeria and allAfrica"),
    ].join(""),
  },
  {
    slug: "zimbabwe-courts-russian-investment-energy-mining-agriculture",
    title: "Zimbabwe courts Russian investment in energy, mining and digital technology",
    excerpt:
      "Back in Harare, the President described the Moscow engagements as satisfying and said he expected Russian business delegations to follow.",
    category: "economy",
    event: "third-russia-africa-summit-moscow-2026",
    published: day("2026-10-30"),
    tags: ["Russia", "Investment", "Mining", "Energy"],
    lead: "kremlin-view",
    content: [
      para(
        "The delegation that travelled to Moscow went with a stated shopping list: investment in energy, mining, agriculture and digital technology, and an argument that Zimbabwe's economy needs diversification and jobs for young people rather than another round of memoranda.",
      ),
      para(
        "On his return the President said Russian businesses had expressed interest in investing in Zimbabwe and that he expected delegations to visit. No specific signed agreements were independently confirmed in the days after the summit.",
      ),
      fig("mnangagwa-kremlin-2019"),
      para(
        "It is the kind of claim worth a diary note. The useful follow-up is not the communiqué but the arrivals: which companies come, to which sector, and on what terms.",
      ),
      note("Zimbabwean state and private media reports from 29 and 30 October 2026"),
    ].join(""),
  },
  {
    slug: "zanu-pf-conference-chinhoyi-resolutions",
    title: "Chinhoyi conference moves ZANU PF's congress to 2029 and names a sole candidate",
    excerpt:
      "The party's 23rd National People's Conference resolved to align its constitution with the amended national charter, shifting the next congress from 2027 to 2029 and naming the President as its sole presidential candidate.",
    category: "politics",
    event: "zanu-pf-23rd-national-peoples-conference",
    published: day("2026-10-18"),
    tags: ["ZANU PF", "Vision 2030", "Chinhoyi", "Succession"],
    lead: "chinhoyi-morning",
    content: [
      para(
        "ZANU PF's 23rd National People's Conference closed at Chinhoyi University of Technology on 17 October with resolutions aligning the party constitution to Constitutional Amendment No. 3, the law the President signed on 7 July.",
      ),
      para(
        "The effect is to move the party's 8th National People's Congress from 2027 to 2029 and to keep the President at the head of the party on a timeline that runs with the extended national one. The resolutions state that he must be the sole party presidential candidate at that congress.",
      ),
      h2("Other resolutions"),
      para(
        "The conference also resolved to translate the party constitution into Zimbabwe's sixteen official languages, to build out the manufacturing capacity of the National Pharmaceutical Company, and to act against party members of parliament who were absent for the vote on the constitutional amendment bill.",
      ),
      fig("chinhoyi-caves"),
      h2("What is contested"),
      para(
        "Reporting around the conference described resistance from the faction aligned to Vice-President Constantino Chiwenga, who used his own remarks to call for a brutal self-appraisal. Outside the party, challenges to the term extension are before the Constitutional Court, on the argument that the changes required a referendum.",
        "Those cases are unresolved, and any account of the conference that leaves them out is incomplete.",
      ),
      para(
        "In closing remarks the President told ministries, departments and agencies to move with urgency on the resolutions.",
      ),
      note(
        "the published ZANU PF conference resolutions, The Herald, NewZimbabwe, The NewsHawks and allAfrica",
      ),
    ].join(""),
  },
  {
    slug: "president-urges-higher-output-2026-27-season",
    title: "President urges higher output for the 2026–27 summer cropping season",
    excerpt:
      "Opening the Chinhoyi conference, he pressed for continuation of the Presidential Pfumvudza/Intwasa programme and more attention to climate-related risk.",
    category: "agriculture",
    event: "zanu-pf-23rd-national-peoples-conference",
    published: day("2026-10-16"),
    tags: ["Agriculture", "Pfumvudza", "Climate", "Food Security"],
    lead: "maize-cobs",
    content: [
      para(
        "Opening the 23rd ZANU PF National People's Conference in Chinhoyi on 16 October, the President called for increased agricultural production in the 2026–27 summer cropping season, urging continuation of the Presidential Pfumvudza/Intwasa programme and greater attention to climate-related risks.",
      ),
      para(
        "The appeal came a week after the national launch of the season's programme at Chivi, and against a seasonal forecast that gives an El Niño event a probability of between 88 and 94 percent.",
      ),
      note("ZBC News and The Herald"),
    ].join(""),
  },
  {
    slug: "pfumvudza-intwasa-launched-chivi-drier-season",
    title: "Pfumvudza/Intwasa launched at Chivi as forecasters warn of a drier season",
    excerpt:
      "With 2.3 million plots already prepared, the 2026/27 programme opened at Shanduka Village under a forecast that puts the chance of an El Niño at up to 94 percent.",
    category: "agriculture",
    event: "pfumvudza-intwasa-launch-2026-27",
    published: day("2026-10-10"),
    tags: ["Agriculture", "Pfumvudza", "Masvingo", "El Niño"],
    lead: "drought-sentinel",
    content: [
      para(
        "The 2026/27 National Pfumvudza/Intwasa programme and summer inputs distribution was launched at Shanduka Village in Chivi, Masvingo. The President did not attend in person: he was represented by the Minister of Agriculture, Mechanisation and Water Resources Development, Dr Anxious Masuka, and his message was delivered by the Permanent Secretary, Professor Obert Jiri.",
      ),
      h2("The numbers"),
      para(
        "More than 2.3 million Pfumvudza/Intwasa plots had been prepared nationwide ahead of the main season, covering about one million hectares. The Meteorological Services Department puts the probability of an El Niño event during the season at 88 to 94 percent.",
      ),
      fig("ebenezer-farm"),
      para(
        "The message to chiefs, headmen and village heads was to get farmers establishing plots, to reserve a plot for drought-tolerant traditional grains, and to hold surplus in household granaries as a buffer.",
      ),
      h2("The caveat"),
      para(
        "Plots prepared is a measure of preparation, not of harvest. Commentary around the launch made the point bluntly: the reserves being described have not yet been tested by a failed season.",
      ),
      note("The Herald, Zimbabwe Situation and published commentary from October 2026"),
    ].join(""),
  },
  {
    slug: "zimbabwe-at-81st-un-general-assembly",
    title: "Zimbabwe at the 81st General Assembly, with a Security Council seat in hand",
    excerpt:
      "A week in New York for the General Debate, plus a business forum on unlocking financing — the first General Assembly since Zimbabwe won a rotating Security Council seat in June.",
    category: "diplomacy",
    event: "unga-81st-session-new-york-2026",
    published: day("2026-09-24"),
    tags: ["United Nations", "New York", "Re-engagement"],
    lead: "unga-hall",
    content: [
      para(
        "The President spent 19 to 25 September in New York for the 81st session of the United Nations General Assembly, his first since Zimbabwe was elected to a rotating seat on the Security Council on 3 June.",
      ),
      para(
        "Alongside the General Debate the delegation convened a Zimbabwe Business Forum on unlocking financing for key sectors — the standing theme of the government's re-engagement effort, and the one that gets tested in arrears negotiations rather than in speeches.",
      ),
      fig("un-emblem"),
      note("Wikipedia's record of presidential trips and contemporaneous reporting"),
    ].join(""),
  },
  {
    slug: "zimbabwe-at-46th-sadc-summit-durban",
    title: "Zimbabwe at the 46th SADC Summit in Durban",
    excerpt: "Two days in Durban in August, two months before Harare took the COMESA chair.",
    category: "diplomacy",
    event: "sadc-46th-summit-durban-2026",
    published: day("2026-08-17"),
    tags: ["SADC", "Durban", "Regional Integration"],
    lead: "durban-centre",
    content: [
      para(
        "The President attended the 46th Summit of SADC Heads of State and Government in Durban on 16 and 17 August.",
      ),
      para(
        "The Durban summit and the COMESA chairmanship that followed in October form a single story for anyone covering the regional file: two overlapping blocs, two sets of commitments, and a Tripartite Free Trade Area meant to stitch them together.",
      ),
      fig("durban-harbour"),
      note("Wikipedia's record of presidential trips"),
    ].join(""),
  },
  {
    slug: "fourth-session-sa-zimbabwe-bi-national-commission",
    title: "Harare and Pretoria convene the fourth Bi-National Commission",
    excerpt:
      "Four days after the Durban summit, the President met President Cyril Ramaphosa in Pretoria for the fourth session of the two countries' Bi-National Commission.",
    category: "official-visits",
    event: "sa-zimbabwe-bi-national-commission-2026",
    published: day("2026-08-21"),
    tags: ["South Africa", "Pretoria", "Bi-National Commission"],
    lead: "union-buildings",
    content: [
      para(
        "The President travelled to Pretoria on 21 August to meet President Cyril Ramaphosa for the Fourth Session of the South Africa–Zimbabwe Bi-National Commission.",
      ),
      para(
        "The commission is the formal channel for the bilateral relationship that matters most to ordinary Zimbabweans — border management at Beitbridge, migration and permits, energy and trade.",
      ),
      fig("ramaphosa"),
      note("Wikipedia's record of presidential trips"),
    ].join(""),
  },
  {
    slug: "forty-sixth-heroes-day-national-heroes-acre",
    title: "Forty-sixth Heroes' Day commemorated at the National Heroes Acre",
    excerpt: "The annual commemoration on 10 August, followed by Defence Forces Day the next morning.",
    category: "national-events",
    event: "heroes-day-2026-national-heroes-acre",
    published: day("2026-08-10"),
    tags: ["Heroes Day", "Defence Forces Day", "National Heroes Acre"],
    lead: "heroes-acre-obelisk",
    content: [
      para(
        "The President delivered the address at the forty-sixth Heroes' Day commemorations at the National Heroes Acre in Harare on 10 August. Defence Forces Day followed on 11 August.",
      ),
      fig("heroes-acre-soldier"),
      para(
        "The two days are a fixed point in the national calendar and one of the few occasions that reliably puts the whole security and political leadership on one platform.",
      ),
      note("the published text of the Heroes Day address and the 2026 public holiday calendar"),
    ].join(""),
  },
  {
    slug: "zimbabwe-elected-un-security-council-seat",
    title: "Zimbabwe elected to a rotating UN Security Council seat",
    excerpt:
      "The 3 June vote in New York gives Harare a seat at the Council — and a diplomatic argument it has been building toward since the Maputo state visit in November 2025.",
    category: "government",
    event: null,
    published: day("2026-06-03"),
    tags: ["United Nations", "Security Council", "Re-engagement"],
    lead: "unga-hall-2",
    content: [
      para("Zimbabwe was elected to a rotating seat on the United Nations Security Council on 3 June."),
      para(
        "The campaign has a visible trail. On the state visit to Maputo in November 2025 the government sought Mozambique's backing for the candidacy and held the inaugural session of the two countries' Bi-National Commission at the same time.",
      ),
      fig("mnangagwa-ticad9"),
      note("Wikipedia's 2026 Zimbabwe timeline and its record of presidential trips"),
    ].join(""),
  },
  {
    slug: "global-tourism-forum-angola-investment-summit-luanda",
    title: "Tourism as an investment case: the President in Luanda",
    excerpt:
      "Three days at the Global Tourism Forum Angola Investment Summit, on tourism-led economic development and regional cooperation.",
    category: "development",
    event: "global-tourism-forum-luanda-2026",
    published: day("2026-06-18"),
    tags: ["Tourism", "Angola", "Investment"],
    lead: "luanda-bay",
    content: [
      para(
        "The President attended the Global Tourism Forum Angola Investment Summit 2026 in Luanda from 17 to 19 June as a distinguished guest, at a meeting focused on tourism-led economic development, investment and regional cooperation.",
      ),
      fig("victoria-falls"),
      para(
        "For Zimbabwe the subject is not abstract. Tourism receipts turn on air connectivity and visas as much as on the attractions themselves — the same argument the COMESA Authority would return to in October when it urged members to operationalise the business visa.",
      ),
      note("Wikipedia's record of presidential trips"),
    ].join(""),
  },
  {
    slug: "president-in-lobamba-for-king-mswati-double-celebration",
    title: "President in Lobamba for King Mswati III's double celebration",
    excerpt:
      "A working visit to Eswatini for the twin commemoration of the King's 58th birthday and the 40th anniversary of his reign.",
    category: "official-visits",
    event: "eswatini-double-celebration-2026",
    published: day("2026-04-27"),
    tags: ["Eswatini", "Lobamba", "State Occasions"],
    lead: "mswati",
    content: [
      para(
        "The President made a working visit to Lobamba on 26 and 27 April for King Mswati III's double celebration, marking the King's 58th birthday and the 40th anniversary of his reign.",
      ),
      fig("mswati-airport"),
      note("Wikipedia's record of presidential trips"),
    ].join(""),
  },
  {
    slug: "zimbabwe-at-46-independence-flame-lit-at-maphisa",
    title: "Zimbabwe at 46: the Independence flame is lit at Maphisa",
    excerpt:
      "Matabeleland South's turn in the rotation brought the main celebrations to a refurbished Maphisa Stadium — and brought some of the crowd across flooded rivers to get there.",
    category: "national-events",
    event: "independence-day-2026-maphisa",
    published: day("2026-04-18"),
    tags: ["Independence Day", "Matabeleland South", "Devolution", "Matobo"],
    lead: "zimbabwe-bird-flag",
    content: [
      para(
        "President Mnangagwa lit the Independence Flame at Maphisa Stadium in Matobo District on 18 April, at the forty-sixth Independence Day celebrations. The theme was “Zim@46 – Unity and Development Towards Vision 2030”.",
      ),
      h2("Why Maphisa"),
      para(
        "Since 2021 the main Independence Day celebrations and the Children's Party have rotated among the ten provinces rather than staying in Harare. This was Matabeleland South's turn, and the government presents the rotation as decentralisation in practice.",
      ),
      para(
        "Maphisa Stadium was refurbished for the occasion, with terracing, ablution facilities and security works, and authorities expected a crowd above 50,000. The flame itself had been on the road since 10 April, when its journey began at Zezani Assembly Point in Beitbridge.",
      ),
      fig("matobo-cave"),
      h2("Getting there"),
      para(
        "Live coverage on the day reported attendees still en route struggling to cross flooded rivers, which is the part of a devolved national event that does not appear in the programme.",
      ),
      note("Nehanda Radio, The Herald, NewsDay's live blog and the Zimbabwe Tourism Authority"),
    ].join(""),
  },
  {
    slug: "eleven-agreements-signed-on-state-visit-to-ghana",
    title: "Eleven agreements signed on the State Visit to Ghana",
    excerpt:
      "Three days in Accra closed with ten government-to-government memoranda and one private sector agreement, and a tour of the Sweden Ghana Medical Centre.",
    category: "official-visits",
    event: "state-visit-ghana-accra-2026",
    published: day("2026-04-03"),
    tags: ["Ghana", "Accra", "Health", "Economic Diplomacy"],
    lead: "accra-city",
    content: [
      para(
        "The President was in Accra from 1 to 3 April on a State Visit that finalised eleven agreements: ten government-to-government memoranda of understanding and one private sector agreement.",
      ),
      para(
        "The programme included a tour of the Sweden Ghana Medical Centre, a reference point in the argument that Zimbabwe should be treating more of its own patients at home.",
      ),
      fig("accra-airport-city"),
      note("Wikipedia's record of presidential trips"),
    ].join(""),
  },
  {
    slug: "government-suspends-raw-mineral-and-lithium-concentrate-exports",
    title: "Government suspends raw mineral and lithium concentrate exports",
    excerpt:
      "The February suspension is the domestic version of the argument the President carried into the COMESA chair eight months later.",
    category: "economy",
    event: null,
    published: day("2026-02-26"),
    tags: ["Mining", "Lithium", "Beneficiation", "Critical Minerals"],
    lead: "bikita-lithium",
    content: [
      para(
        "The government suspended exports of raw minerals and lithium concentrate with effect from 25 February.",
      ),
      para(
        "Read alongside October's COMESA communiqué, which recorded the Authority's concern at the export of critical minerals in raw or minimally processed form, the measure is the national half of a regional argument.",
      ),
      fig("artisanal-miners"),
      para(
        "The reporting question is capacity: whether domestic processing can absorb what is no longer leaving the country, and on what timeline.",
      ),
      note("Wikipedia's 2026 Zimbabwe timeline and contemporaneous wire reporting"),
    ].join(""),
  },
  {
    slug: "africa-panel-at-world-governments-summit-dubai",
    title: "An Africa panel in Dubai opens the President's 2026 travel diary",
    excerpt:
      "The year's first foreign trip took him to the World Governments Summit and a high-level panel with the Presidents of Botswana and Sierra Leone.",
    category: "diplomacy",
    event: "world-governments-summit-dubai-2026",
    published: day("2026-02-04"),
    tags: ["Dubai", "Re-engagement", "World Governments Summit"],
    lead: "wgs-dubai",
    content: [
      para(
        "The President's first foreign trip of 2026 was to Dubai for the World Governments Summit, from 1 to 5 February.",
      ),
      para(
        "He joined a high-level panel on Africa's future with the Presidents of Botswana and Sierra Leone, moderated by Tucker Carlson. The trip was presented at home as part of Zimbabwe's re-engagement effort.",
      ),
      fig("wgs-dubai-2"),
      note("Wikipedia's record of presidential trips"),
    ].join(""),
  },
  {
    slug: "notebook-a-year-on-the-presidential-beat",
    title: "Notebook: a year on the presidential beat",
    excerpt:
      "Eight foreign trips, a rotating national commemoration, a party conference and a summit of twenty-one states — and the stories that lived between the programmes.",
    category: "news",
    event: null,
    published: day("2026-10-31"),
    tags: ["Reporter's Notebook", "Vision 2030"],
    lead: "harare-vendors",
    content: [
      para(
        "Dubai in February, Accra in April, Lobamba a few weeks later, Luanda in June, Durban and Pretoria in August, New York in September, Moscow at the end of October. Eight trips abroad, and at home a flame lit at Maphisa, a conference at Chinhoyi and twenty-one delegations at Mount Hampden.",
      ),
      h2("What the programmes leave out"),
      para(
        "The official diary is a clean document. The year it sat inside was not: at least 94 people died when an over-capacity ferry capsized on Lake Kariba in August, a nationwide blackout followed a fault on the ZESA grid in July, and the road toll — Bulawayo in April, Suswe and Kwekwe in May, Gweru and Triangle in June, Chivhu in August — kept its own grim count.",
      ),
      fig("mnangagwa-headlands"),
      h2("The question that carries into 2027"),
      para(
        "In June parliament passed a constitutional amendment extending presidential and parliamentary terms from five to seven years and replacing direct presidential elections with selection by parliament. The President signed it on 7 July. In October the ruling party aligned its own constitution to it and named him its sole candidate for 2030.",
        "Challenges to the amendment are before the Constitutional Court, on the argument that it required a referendum. Nothing on this beat matters more in the coming year.",
      ),
      note("the year's filed coverage and Wikipedia's 2026 Zimbabwe timeline"),
    ].join(""),
  },
];

// ─── Script ──────────────────────────────────────────────────────────────────

const SETTINGS = {
  siteName: "ZimWatchline",
  tagline:
    "Covering the Office of the President — state occasions, regional summits and the national programmes in between.",
  authorName: "Hilda Sena",
  authorBio:
    "Hilda Sena is a presidential correspondent based in Harare. She covers State House and the national calendar, from Independence Day and Heroes' Day to Zimbabwe's engagements with COMESA, SADC, the African Union and the United Nations.",
  location: "Harare, Zimbabwe",
};

async function clear() {
  const articleSlugs = [...ARTICLES.map((a) => a.slug), DRAFT_SLUG];
  const eventSlugs = EVENTS.map((e) => e.slug);
  await db.media.deleteMany({ where: { url: { startsWith: COMMONS_HOST } } });
  await db.article.deleteMany({ where: { slug: { in: articleSlugs } } });
  await db.event.deleteMany({ where: { slug: { in: eventSlugs } } });

  // Sweep out content earlier versions of this script created: the fictional
  // "sample-*" stories and the picsum.photos placeholder images.
  await db.article.deleteMany({ where: { slug: { startsWith: "sample-" } } });
  await db.event.deleteMany({ where: { slug: { startsWith: "sample-" } } });
  await db.media.deleteMany({ where: { url: { startsWith: LEGACY_PLACEHOLDER_HOST } } });
  await db.media.deleteMany({ where: { url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ" } });

  await db.tag.deleteMany({ where: { articles: { none: {} } } });
  console.log("✓ Demo content removed (site settings are left as they are)");
}

async function seed() {
  await clear();

  // Categories normally come from `npm run db:seed`; upsert the ones used here so
  // this script also works on its own.
  const used = [...new Set(ARTICLES.map((a) => a.category))];
  const categories = await Promise.all(
    used.map((slug) =>
      db.category.upsert({
        where: { slug },
        create: { slug, name: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) },
        update: {},
      }),
    ),
  );
  const catId = (slug: string) => categories.find((c) => c.slug === slug)?.id ?? null;

  const events = new Map<string, { id: string; title: string; location: string; startDate: Date }>();
  for (const e of EVENTS) {
    const event = await db.event.create({
      data: {
        slug: e.slug,
        title: e.title,
        location: e.location,
        startDate: e.startDate,
        endDate: e.endDate,
        description: e.description,
        coverImage: photoUrl(e.gallery[0]),
      },
    });
    events.set(e.slug, {
      id: event.id,
      title: e.title,
      location: e.location,
      startDate: e.startDate,
    });
  }

  // One Media row per photograph: attached to the event whose gallery it belongs
  // to, or left loose in the archive.
  const ownerOf = new Map<PhotoId, string>();
  for (const e of EVENTS) for (const id of e.gallery) ownerOf.set(id, e.slug);

  const mediaIds = new Map<PhotoId, string>();
  const allPhotos = [...new Set<PhotoId>([
    ...EVENTS.flatMap((e) => [...e.gallery]),
    ...ARCHIVE,
  ])];
  for (const id of allPhotos) {
    const p = PHOTOS[id];
    const owner = ownerOf.get(id);
    const event = owner ? events.get(owner) : undefined;
    const media = await db.media.create({
      data: {
        type: "video" in p && p.video ? "VIDEO" : "IMAGE",
        url: photoUrl(id),
        thumbnailUrl: "video" in p && p.video ? null : sized(id, THUMB_WIDTH),
        width: p.w,
        height: p.h,
        title: p.title,
        caption: photoCaption(id),
        takenAt: p.takenAt,
        location: p.place ?? event?.location ?? null,
        eventId: event?.id ?? null,
      },
    });
    mediaIds.set(id, media.id);
  }

  for (const a of ARTICLES) {
    const event = a.event ? events.get(a.event) : undefined;
    const eventGallery = a.event
      ? (EVENTS.find((e) => e.slug === a.event)?.gallery ?? [])
      : [];
    const galleryIds = eventGallery
      .slice(0, 4)
      .map((id) => mediaIds.get(id))
      .filter((id): id is string => Boolean(id));
    const tags = await Promise.all(
      a.tags.map((name) => {
        const slug = slugify(name, { lower: true, strict: true, trim: true });
        return db.tag.upsert({ where: { slug }, create: { name, slug }, update: {} });
      }),
    );
    await db.article.create({
      data: {
        slug: a.slug,
        title: a.title,
        excerpt: a.excerpt,
        content: a.content,
        featuredImage: photoUrl(a.lead),
        featuredImageCaption: photoCaption(a.lead),
        categoryId: catId(a.category),
        eventId: event?.id ?? null,
        eventDate: event?.startDate ?? null,
        eventLocation: event?.location ?? "Harare",
        status: "PUBLISHED",
        isFeatured: a.featured === true,
        publishedAt: a.published,
        tags: { connect: tags.map((t) => ({ id: t.id })) },
        galleryImages: { connect: galleryIds.map((id) => ({ id })) },
      },
    });
  }

  // One draft, to show that unpublished work stays private.
  await db.article.create({
    data: {
      slug: DRAFT_SLUG,
      title: "Constitutional Amendment No. 3: the cases before the Constitutional Court (draft)",
      excerpt:
        "Working notes on the challenges to the term extension. Drafts stay private until you publish them.",
      content: [
        para(
          "Working file. The National Assembly passed the amendment on 19 June 2026; the President signed it on 7 July. Challenges argue the changes required a referendum.",
        ),
        para("To do: get the case numbers, the applicants, and a hearing date."),
      ].join(""),
      status: "DRAFT",
      categoryId: catId("politics"),
    },
  });

  await db.setting.upsert({
    where: { id: 1 },
    create: { id: 1, ...SETTINGS },
    update: SETTINGS,
  });

  console.log(
    `✓ Demo content added: ${EVENTS.length} events, ${ARTICLES.length + 1} articles, ` +
      `${allPhotos.length} photographs (all real, all credited)`,
  );
  console.log(`✓ Site settings set to “${SETTINGS.siteName}” / ${SETTINGS.authorName}`);
}

const run = process.argv.includes("--clear") ? clear : seed;

run()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
