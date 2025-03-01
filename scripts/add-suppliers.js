// Script para añadir proveedores a Firebase
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs 
} = require('firebase/firestore');

// Importamos la configuración de Firebase desde el archivo de configuración
const firebaseConfig = require('../src/lib/firebase').firebaseConfig;

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Proveedor europeo para agregar
const europeanSuppliers = [
  {
    name: "Rebel",
    region: "european",
    notes: "Preu Mig, Sol tenir Stock?",
    email: "", // No proporcionado
    phone: "", // No proporcionado
    country: "" // No proporcionado
  }
];

// Proveedores pendientes para agregar
const missingSuppliers = [
  {
    name: "Asmodee Belgica",
    email: "info_be@asmodee.com",
    emailSent: true,
    emailDate: "2024-02-24",
    responded: false,
    info: ""
  },
  {
    name: "Asmodee Nordics",
    email: "salesnordics@asmodee.com",
    emailSent: true,
    emailDate: "2024-02-24",
    responded: false,
    info: ""
  },
  {
    name: "Asmodee Netherlands",
    email: "info.nl@asmodee.com",
    emailSent: true,
    emailDate: "2024-02-24",
    responded: false,
    info: ""
  },
  {
    name: "Asmodee Czech",
    email: "export-cz@asmodee.com",
    emailSent: true,
    emailDate: "2024-02-24",
    responded: false,
    info: ""
  },
  {
    name: "Asmodee UK",
    email: "info@asmodee.co.uk",
    emailSent: true,
    emailDate: "2024-02-24",
    responded: false,
    info: "De moment no obren noves reques"
  },
  {
    name: "Kaissa",
    email: "info@kaissa.gr",
    emailSent: true,
    emailDate: "2024-02-24",
    responded: false,
    info: "De moment no obren noves reques\nDemanaven Una web"
  },
  {
    name: "International Collectibles",
    email: "ori@intlcollectibles.com",
    emailSent: true,
    emailDate: "2024-02-24",
    responded: false,
    info: ""
  },
  {
    name: "Active Gulf",
    email: "support@active-gulf.com",
    emailSent: true,
    emailDate: "2024-02-24",
    responded: false,
    info: ""
  },
  {
    name: "HEO",
    email: "Ruben.Castro@heo.com",
    emailSent: false,
    emailDate: "", // No se ha enviado
    responded: false,
    info: "Demanaven una web"
  },
  {
    name: "BlackFire",
    email: "info@blackfire.eu",
    emailSent: true,
    emailDate: "2024-02-24",
    responded: false,
    info: "+49 2102 30592 0\nContact\nhttps://www.blackfire.eu/en-gb/contact-us"
  },
  {
    name: "Cees Cards",
    email: "https://ceescards.eu/contact/",
    emailSent: true,
    emailDate: "2024-02-24",
    responded: false,
    info: ""
  },
  {
    name: "4x Trading",
    email: "info@4xtrading.eu",
    emailSent: true,
    emailDate: "2024-02-24",
    responded: false,
    info: ""
  },
  {
    name: "UK pero son cheap",
    email: "support@totalcards.net",
    emailSent: true,
    emailDate: "2024-02-24",
    responded: false,
    info: ""
  },
  {
    name: "Creative Toys",
    email: "",
    emailSent: false,
    emailDate: "",
    responded: false,
    info: "Ya no envien a españa"
  },
  {
    name: "Games Island",
    email: "",
    emailSent: false,
    emailDate: "",
    responded: false,
    info: ""
  },
  {
    name: "TCG Factory",
    email: "",
    emailSent: false,
    emailDate: "",
    responded: false,
    info: ""
  },
  {
    name: "Dispersa",
    email: "",
    emailSent: false,
    emailDate: "",
    responded: false,
    info: ""
  },
  {
    name: "Bandai",
    email: "",
    emailSent: false,
    emailDate: "",
    responded: false,
    info: ""
  },
  {
    name: "HEO",
    email: "",
    emailSent: false,
    emailDate: "",
    responded: false,
    info: "Son de Magic"
  },
  {
    name: "Intrafin",
    email: "",
    emailSent: false,
    emailDate: "",
    responded: false,
    info: ""
  }
];

// Función para comprobar si un proveedor ya existe
async function checkIfSupplierExists(name) {
  const suppliersRef = collection(db, "suppliers");
  const q = query(suppliersRef, where("name", "==", name));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
}

// Función para comprobar si un proveedor pendiente ya existe
async function checkIfMissingSupplierExists(name) {
  const missingRef = collection(db, "missingsuppliers");
  const q = query(missingRef, where("name", "==", name));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
}

// Función para añadir proveedores regulares
async function addEuropeanSuppliers() {
  for (const supplier of europeanSuppliers) {
    try {
      const exists = await checkIfSupplierExists(supplier.name);
      if (exists) {
        console.log(`El proveedor ${supplier.name} ya existe. Saltando...`);
        continue;
      }
      
      const docRef = await addDoc(collection(db, "suppliers"), supplier);
      console.log(`Proveedor ${supplier.name} añadido con ID: ${docRef.id}`);
    } catch (error) {
      console.error(`Error al añadir proveedor ${supplier.name}:`, error);
    }
  }
}

// Función para añadir proveedores pendientes
async function addMissingSuppliers() {
  for (const supplier of missingSuppliers) {
    try {
      const exists = await checkIfMissingSupplierExists(supplier.name);
      if (exists) {
        console.log(`El proveedor pendiente ${supplier.name} ya existe. Saltando...`);
        continue;
      }
      
      const docRef = await addDoc(collection(db, "missingsuppliers"), supplier);
      console.log(`Proveedor pendiente ${supplier.name} añadido con ID: ${docRef.id}`);
    } catch (error) {
      console.error(`Error al añadir proveedor pendiente ${supplier.name}:`, error);
    }
  }
}

// Ejecutar las funciones
async function run() {
  console.log("Iniciando carga de proveedores a Firebase...");
  
  try {
    console.log("--- Añadiendo proveedores europeos ---");
    await addEuropeanSuppliers();
    
    console.log("--- Añadiendo proveedores pendientes ---");
    await addMissingSuppliers();
    
    console.log("Proceso completado con éxito!");
  } catch (error) {
    console.error("Error durante la ejecución:", error);
  }
}

// Ejecutar el script
run(); 