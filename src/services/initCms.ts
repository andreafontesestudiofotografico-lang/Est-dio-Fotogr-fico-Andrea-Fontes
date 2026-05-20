import { getPackages, savePackage, getSiteSettings, saveSiteSettings } from "./cms";
import { Package, SiteSettings } from "../types";
import { photographyExperiences } from "../pages/public/Packages";

const defaultSettings: SiteSettings = {
  home: {
    block1: {
      title: "Experiências Mais Procuradas",
      description: "Essência, autenticidade e conexão. Descubra os ensaios mais desejados do estúdio."
    },
    block2: {
      title: "Ensaios Editoriais",
      description: "Produções exclusivas de alto padrão visual."
    }
  }
};

export async function initCMS() {
  try {
    const existingPackages = await getPackages();
    if (existingPackages.length === 0) {
      console.log("Seeding default packages...");
      let order = 0;
      for (const exp of photographyExperiences) {
        const pkg: Package = {
          id: exp.id,
          title: exp.title,
          image: exp.image,
          shortDesc: exp.shortDesc || "",
          desc: exp.desc || "",
          options: exp.options || [],
          info: exp.info || {},
          active: true,
          showInHome: true,
          showInPackages: true,
          order: order++
        };
        await savePackage(pkg);
      }
    }

    const currentSettings = await getSiteSettings();
    if (!currentSettings) {
      console.log("Seeding default settings...");
      await saveSiteSettings(defaultSettings);
    }
  } catch (err) {
    console.error("Error seeding initial CMS data:", err);
  }
}
