// Script para crear un nuevo grupo de enlaces de compra de Pokemon y añadir todos los enlaces
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore/lite';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore/lite';

// Configuración de Firebase (copiar de src/lib/firebase.ts)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Lista de enlaces a agregar
const pokemonLinks = [
  { url: "https://games-island.eu/?lang=eng", title: "Games Island", description: "Tienda europea de juegos" },
  { url: "https://distribution.rebel.pl/search/card-games/pokemon-tcg", title: "Rebel Distribution", description: "Distribuidor polaco" },
  { url: "https://pokepackshop.nl/en/", title: "PokePackShop", description: "Want to buy Pokemon Cards? - Immediately available" },
  { url: "https://flashstore.es/", title: "Flash Store", description: "Tienda de Cartas POKEMON Online: ¡Las Mejores Ofertas!" },
  { url: "https://docs.google.com/spreadsheets/d/1J1jF02yuGXhTYs6JpPGzWch7p1XCRoDARJMH45KL17M/edit?gid=0#gid=0", title: "Google Sheets Database", description: "Base de datos en Google Sheets" },
  { url: "https://es.pokeflip.com/", title: "PokeFlip", description: "Tienda española de cartas Pokémon" },
  { url: "https://www.tcgplayer.com/categories/trading-and-collectible-card-games/pokemon/price-guides", title: "TCGPlayer", description: "Guías de precios de Pokémon TCG" },
  { url: "https://www.cardgameshop.be/nl/categorieen/pokemon-boosterboxen", title: "Card Game Shop", description: "Tienda belga de booster boxes" },
  { url: "https://es.wallapop.com/wall", title: "Wallapop", description: "Marketplace de segunda mano" },
  { url: "https://tcgfish.com/", title: "TCG Fish", description: "Herramienta de seguimiento de precios" },
  { url: "https://www.cardmarket.com/en/Pokemon", title: "CardMarket", description: "El marketplace más grande de Europa para TCGs" },
  { url: "https://manavortex.es/cateogoria-producto/tcg/pokemon-tcg", title: "Manavortex", description: "Tienda española de cartas Pokémon" },
  { url: "https://4xtrading.eu/categoria-prodotto/pokemon/", title: "4xTrading", description: "Tienda italiana de cartas" },
  { url: "https://www.pokeviert.shop/collections/displays", title: "Pokeviert", description: "Tienda de displays Pokémon" },
  { url: "https://www.darwinex.com/es/tick-data", title: "Darwinex", description: "Datos de mercado" },
  { url: "https://www.cardtrader.com/en/pokemon", title: "CardTrader", description: "Plataforma de trading de cartas" },
  { url: "https://tcgfactory.com/en/", title: "TCG Factory", description: "Fabricante de accesorios para TCG" },
  { url: "https://rubygator.com/en", title: "Ruby Gator", description: "Tienda de cartas en inglés" },
  { url: "https://pokepacks.shop/", title: "Pokepacks Shop", description: "Tienda de sobres de Pokémon" },
  { url: "https://www.generacionx.es/juegos-de-cartas", title: "Generación X", description: "Tienda española de juegos" },
  { url: "https://dispersajuguetes.com/", title: "Dispersa Juguetes", description: "Tienda de juguetes y cartas" },
  { url: "https://www.pokecardshop.be/", title: "Pokecard Shop", description: "Tienda belga de cartas Pokémon" },
  { url: "https://www.instagram.com/laurine._verbrug/", title: "Instagram Dealer", description: "Vendedor de Instagram" },
  { url: "https://www.ebay.es/str/grangma?widget_ver=artemis&media=WHATS_APP", title: "Ebay Grangma", description: "Tienda en Ebay" },
  { url: "https://meccha-japan.com/en/", title: "Meccha Japan", description: "Tienda japonesa" },
  { url: "https://www.ebay.es/", title: "Ebay España", description: "Plataforma de compraventa online" },
  { url: "https://tcghobby.com/", title: "TCG Hobby", description: "Tienda especializada en TCG" },
  { url: "https://yonko-tcg.de/", title: "Yonko TCG", description: "Tienda alemana de TCG" },
  { url: "https://www.card-corner.de/Pokemon-Display", title: "Card Corner", description: "Tienda alemana de cartas" },
  { url: "https://pokepacks.shop/collections/cajas-de-sobres", title: "Pokepacks Shop", description: "Tienda de cajas de sobres" },
  { url: "https://www.padis-store.com/es/112-pokemon", title: "Padis Store", description: "Tienda de productos Pokémon" },
  { url: "https://zardocards.com/collections/all-booster-boxes", title: "Zardo Cards", description: "Tienda de booster boxes" },
  { url: "https://www.crazycards.eu/pokemon", title: "Crazy Cards", description: "Tienda europea de cartas" },
  { url: "https://www.turolgames.com/en/", title: "Turol Games", description: "Tienda española de juegos" },
  { url: "https://www.empiregames.es/preventa-juegoscartas-coleccionables-2", title: "Empire Games", description: "Tienda española de juegos" },
  { url: "https://www.kelz0r.dk/magic/index.php", title: "Kelz0r", description: "Tienda danesa de TCG" },
  { url: "https://www.grosnor.com/grosnor.products.php?CID=234", title: "Grosnor", description: "Distribuidor canadiense" },
  { url: "https://webshopnl.asmodee.com/nl-nl/klant", title: "Asmodee Shop", description: "Tienda oficial de Asmodee" },
  { url: "https://www.gametrade.it/login?returl=/Category/Pokemon", title: "Game Trade", description: "Distribuidor italiano" },
  { url: "https://wpn.wizards.com/es/news/interested-wpn-premium-should-be-your-first-step", title: "Wizards Play Network", description: "Red de juego de Wizards" },
  { url: "https://societools.com/pinterest-downloader", title: "SocieTools", description: "Herramienta para descargar de Pinterest" },
  { url: "https://www.e-minis.net/juegos/trading-card-games/pokemon/", title: "E-minis", description: "Tienda española de miniaturas y TCG" },
  { url: "https://www.legendarycards.eu/", title: "Legendary Cards", description: "Tienda europea de cartas" },
  { url: "https://cardotaku.com/pages/pokemon-card-game-scarlet-violet", title: "Card Otaku", description: "Tienda especializada en Pokémon" },
  { url: "https://summoner.nl/?subcats=Y&pcode_from_q=Y&pshort=Y&pfull=Y&pname=Y&pkeywords=Y&search_performed=Y&q=pokemon&dispatch=products.search&security_hash=245328b6cd3b3b4820eb7059474fc57f", title: "Summoner", description: "Tienda holandesa de juegos" },
  { url: "https://www.spellenvariant.nl/trading-card-games/pokemon", title: "Spellenvariant", description: "Tienda holandesa de juegos" },
  { url: "https://en.pokemart.be/product-category/pokemon-en/", title: "PokeMart", description: "Tienda belga de productos Pokémon" },
  { url: "https://www.bescards.nl/pokemon/?stock_status=instock&per_row=4&shop_view=grid&per_page=64", title: "BES Cards", description: "Tienda holandesa de cartas" },
  { url: "https://hobbiesville.com/collections/pokemon?product_line=All&sort=Recently+Added&limit=30&shopify_collection_id=261460656150", title: "Hobbiesville", description: "Tienda de hobbies y coleccionables" },
  { url: "https://www.hirocards.com/", title: "Hiro Cards", description: "Tienda de cartas japonesas" },
  { url: "https://www.pokecardshop.be/booster-boxes", title: "Pokecard Shop", description: "Tienda belga de booster boxes" },
  { url: "https://www.cardgameshop.be/en/categories/pokemon-boosterboxes", title: "Card Game Shop", description: "Tienda belga de booster boxes" },
  { url: "https://outpostbrussels.be/collections/pokemon/anglais", title: "Outpost Brussels", description: "Tienda en Bruselas" },
  { url: "https://pokemagic.nl/en/product-category/sealed-products/page/1/", title: "PokeMagic", description: "Tienda holandesa de productos sellados" },
  { url: "https://www.tcg-cards.nl/pokemon/booster-box", title: "TCG Cards", description: "Tienda holandesa de booster boxes" },
  { url: "https://www.tcgpokemon.nl/product-category/pokemon-booster-box/", title: "TCG Pokemon", description: "Tienda holandesa especializada en Pokémon" },
  { url: "https://www.monsterkorting.nl/pokemon-booster-boxen/", title: "Monster Korting", description: "Tienda con descuentos en booster boxes" },
  { url: "https://www.trollandtoad.com/pokemon/-sealed-product/3076?Keywords=&hide-oos=on&min-price=&max-price=&items-pp=60&item-condition=&selected-cat=3076&sort-order=H-L&page-no=1&view=list&subproduct=0&Rarity=&CardType=&minHitPoints=&maxHitPoints=", title: "Troll and Toad", description: "Tienda estadounidense de TCG" },
  { url: "https://www.spellenwinkel.nl/en-WW/c/pokemon-booster-boxes/1000400", title: "Spellenwinkel", description: "Tienda holandesa de juegos" },
  { url: "https://cardstore.nl/collections/booster-box", title: "Card Store", description: "Tienda holandesa de cartas" },
  { url: "https://dacardworld.eu/collections/gaming?filter.v.availability=1&filter.v.price.gte=&filter.v.price.lte=&filter.p.vendor=Bandai&filter.p.vendor=Pokemon&filter.p.vendor=Pokemon+USA&sort_by=best-selling", title: "DA Card World", description: "Tienda europea de cartas" },
  { url: "https://www.crazycards.eu/", title: "Crazy Cards EU", description: "Tienda europea de cartas" },
  { url: "https://migashop.shop/", title: "Miga Shop", description: "Tienda de productos japoneses" },
  { url: "https://gpstoretcg.com/collections/pokemon-tcg?filter.v.option.idioma=Ingl%C3%A9s&page=1&sort_by=best-selling", title: "GP Store", description: "Tienda de TCG" },
  { url: "https://storedevastation.com/collections/productos-pokemon-tcg", title: "Store Devastation", description: "Tienda de productos Pokémon" },
  { url: "https://www.todosaintseiya.com/jolisearch?s=pokemon", title: "Todo Saint Seiya", description: "Tienda con productos Pokémon" },
  { url: "https://forevertcg.com/collections/pokemon", title: "Forever TCG", description: "Tienda especializada en TCG" },
  { url: "https://www.southernhobby.com/ccg-s/pokemon/c13_259/", title: "Southern Hobby", description: "Distribuidor de hobbies" },
  { url: "https://www.kelz0r.dk/magic/pokemon-boosters-c-187_191.html", title: "Kelz0r Boosters", description: "Tienda danesa de boosters" }
];

// Función para verificar si un grupo ya existe
async function checkGroupExists(groupName) {
  try {
    const groupsRef = collection(db, 'link_groups');
    const q = query(groupsRef, where('name', '==', groupName));
    const querySnapshot = await getDocs(q);
    
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error al verificar grupo:', error);
    return false;
  }
}

// Función para crear un nuevo grupo
async function createLinkGroup(groupData) {
  try {
    const groupsRef = collection(db, 'link_groups');
    // Usar fecha actual en lugar de serverTimestamp para compatibilidad
    const now = new Date();
    
    const docRef = await addDoc(groupsRef, {
      ...groupData,
      createdAt: now,
      updatedAt: now
    });
    
    return { success: true, groupId: docRef.id };
  } catch (error) {
    console.error('Error al crear grupo:', error);
    return { success: false, error: error.message };
  }
}

// Función para crear un nuevo enlace
async function createLink(linkData) {
  try {
    const linksRef = collection(db, 'links');
    // Usar fecha actual en lugar de serverTimestamp para compatibilidad
    const now = new Date();
    
    const docRef = await addDoc(linksRef, {
      ...linkData,
      clicks: 0,
      active: true,
      createdAt: now,
      updatedAt: now
    });
    
    return { success: true, linkId: docRef.id };
  } catch (error) {
    console.error('Error al crear enlace:', error);
    return { success: false, error: error.message };
  }
}

// Función para añadir enlaces en lotes
async function addLinksInBatches(groupId, links, batchSize = 5) {
  const results = {
    success: true,
    created: 0,
    failed: 0,
    errors: []
  };
  
  try {
    // Procesar los enlaces en lotes
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      
      // Crear enlace
      const result = await createLink({
        groupId,
        title: link.title,
        url: link.url,
        description: link.description || '',
        icon: '',
        order: i + 1 // Para mantener el orden de la lista
      });
      
      if (result.success) {
        results.created++;
      } else {
        results.failed++;
        results.errors.push(`Error en enlace ${i+1} (${link.title}): ${result.error}`);
      }
      
      // Pequeña pausa entre lotes para no sobrecargar 
      if ((i + 1) % batchSize === 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error al procesar lotes:', error);
    results.success = false;
    results.errors.push(`Error general: ${error.message}`);
    return results;
  }
}

// Función principal para crear un grupo y añadir enlaces
export async function createPokemonLinksGroup() {
  try {
    // Verificar si el grupo ya existe
    const groupName = "Tiendas Pokémon";
    const groupExists = await checkGroupExists(groupName);
    
    if (groupExists) {
      return { 
        success: false, 
        error: `El grupo '${groupName}' ya existe.` 
      };
    }
    
    // Crear grupo nuevo
    const groupResult = await createLinkGroup({
      name: groupName,
      description: "Enlaces a tiendas y recursos para comprar cartas Pokémon",
      icon: "shopping-cart",
      order: 1 // Prioridad alta
    });
    
    if (!groupResult.success) {
      return { 
        success: false, 
        error: `Error al crear grupo: ${groupResult.error}` 
      };
    }
    
    // Añadir los enlaces al grupo
    const linksResult = await addLinksInBatches(groupResult.groupId, pokemonLinks);
    
    // Preparar mensaje de resultados
    let message = `Grupo '${groupName}' creado correctamente. `;
    message += `${linksResult.created} enlaces añadidos`;
    
    if (linksResult.failed > 0) {
      message += `, ${linksResult.failed} fallidos.`;
    } else {
      message += ".";
    }
    
    return { 
      success: true, 
      message,
      details: {
        groupId: groupResult.groupId,
        linksAdded: linksResult.created,
        linksFailed: linksResult.failed,
        errors: linksResult.errors
      }
    };
  } catch (error) {
    console.error('Error general:', error);
    return { 
      success: false, 
      error: `Error inesperado: ${error.message}` 
    };
  }
} 