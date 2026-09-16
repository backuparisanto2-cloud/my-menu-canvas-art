import a01 from "@/assets/menu/01-sampul.webp.asset.json";
import a02 from "@/assets/menu/02-kalibul-sate.webp.asset.json";
import a03 from "@/assets/menu/03-kalibul-gule.webp.asset.json";
import a04 from "@/assets/menu/04-sate-dunia-1.webp.asset.json";
import a05 from "@/assets/menu/05-sate-dunia-2.webp.asset.json";
import a06 from "@/assets/menu/06-legenda-1.webp.asset.json";
import a07 from "@/assets/menu/07-legenda-2.webp.asset.json";
import a08 from "@/assets/menu/08-bandeng-pepes.webp.asset.json";
import a09 from "@/assets/menu/09-smart-rice.webp.asset.json";

export type MenuPage = {
  id: string;
  title: string;
  subtitle: string;
  url: string;
};

export const menuPages: MenuPage[] = [
  {
    id: "sampul",
    title: "Umaeh Inyong",
    subtitle: "Sate kambing muda — jam buka & alamat",
    url: a01.url,
  },
  {
    id: "kalibul-sate",
    title: "Menu Kalibul",
    subtitle: "Sate Inyong, Paket 5 Sate, Nasi Goreng Kambing",
    url: a02.url,
  },
  {
    id: "kalibul-gule",
    title: "Menu Kalibul",
    subtitle: "Gule, Tongseng, Sop Kambing, Kalibuling, Gongso",
    url: a03.url,
  },
  {
    id: "sate-dunia-1",
    title: "Sate Kambing se Dunia",
    subtitle: "Bulgogi, Teriyaki, Cheese, Shaslik",
    url: a04.url,
  },
  {
    id: "sate-dunia-2",
    title: "Sate Kambing se Dunia",
    subtitle: "Mentega, Lada Hitam, Barbeque, Curry",
    url: a05.url,
  },
  {
    id: "legenda-1",
    title: "Legenda",
    subtitle: "Nasi rames, nasi goreng, ayam bakar & goreng",
    url: a06.url,
  },
  {
    id: "legenda-2",
    title: "Legenda",
    subtitle: "Gado-gado, mendoan gejot, bakmi jawa, nasi pecel",
    url: a07.url,
  },
  {
    id: "bandeng-pepes",
    title: "Bandeng Pepes Inyong",
    subtitle: "Pepes bandeng, oseng tempe, oseng godong gandul",
    url: a08.url,
  },
  {
    id: "smart-rice",
    title: "Smart Rice",
    subtitle: "Semua varian Rp 10.000",
    url: a09.url,
  },
];

export const IMAGE_WIDTH = 1131;
export const IMAGE_HEIGHT = 1600;
