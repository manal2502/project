

// L'objet Module : Notre interface avec le monde extérieur. Nous importons
// et exporter des valeurs dessus. Il existe différentes manières d'utiliser le module :
// 1. Non défini. Nous le créons ici
// 2. Un paramètre de fonction, function(Module) { ..code généré.. }
// 3. pré-exécution ajoutée, var Module = {}; ..code généré..
// 4. La balise de script externe définit var Module.
// Nous devons vérifier si le module existe déjà (par exemple, cas 3 ci-dessus).
// La substitution sera remplacée par le code réel à un stade ultérieur de la construction,
// de cette façon, le compilateur de fermeture ne le déformera pas (par exemple, cas 4 ci-dessus).
// Notez que si vous souhaitez exécuter la fermeture, et également utiliser le module
// après le code généré, vous devrez définir var Module = {};
// avant le code. Ensuite, cet objet sera utilisé dans le code, et vous
// peut également continuer à utiliser le module par la suite.
var Module = typeof Module != 'undefined' ? Module : {};

// Voir https://caniuse.com/mdn-javascript_builtins_object_assign

// --pre-jses sont émis après le code d'intégration du module, afin qu'ils puissent
// se référer au module (s'ils le souhaitent ; ils peuvent également définir le module)
// {{PRE_JSES}}

// Parfois, un objet Module existant existe avec des propriétés
// destiné à remplacer la fonctionnalité par défaut du module. Ici
// nous collectons ces propriétés et les réappliquons _après_ avoir configuré
// les valeurs par défaut de l'environnement actuel pour éviter d'avoir à l'être
// défensif pendant l'initialisation.
var moduleOverrides = Objet.assign({}, Module);

var arguments_ = [];
var thisProgram = './this.program';
var quit_ = (statut, toThrow) => {
  lancer àJeter;
};

// Déterminer l'environnement d'exécution dans lequel nous nous trouvons. Vous pouvez personnaliser cela en
// définition du paramètre ENVIRONNEMENT au moment de la compilation (voir settings.js).

// Tenter de détecter automatiquement l'environnement
var ENVIRONNEMENT_EST_WEB = typeof window == 'objet';
var ENVIRONNEMENT_EST_TRAVAILLEUR = typeof importScripts == 'fonction';
// L'environnement Nb Electron.js est à la fois un environnement NODE, mais
// également un environnement Web.
var ENVIRONMENT_IS_NODE = typeof processus == 'objet' && typeof processus.versions == 'objet' && typeof processus.versions.node == 'chaîne';
var ENVIRONNEMENT_EST_SHELL = !ENVIRONNEMENT_EST_WEB && !ENVIRONNEMENT_EST_NOEUD && !ENVIRONNEMENT_EST_WORKER;

si (Module['ENVIRONNEMENT']) {
  throw new Error('Module.ENVIRONMENT est obsolète. Pour forcer l'environnement, utilisez l'option de compilation ENVIRONMENT (par exemple, -s ENVIRONMENT=web ou -s ENVIRONMENT=node)');
}

// `/` doit être présent à la fin si `scriptDirectory` n'est pas vide
var scriptDirectory = '';
fonction locateFile(chemin) {
  si (Module['locateFile']) {
    retourner Module['locateFile'](chemin, scriptDirectory);
  }
  retourner scriptDirectory + chemin ;
}

// Hooks implémentés différemment dans différents environnements d'exécution.
var lire_,
    lireAsync,
    lireBinaire,
    définir le titre de la fenêtre;

// Normalement, nous n'enregistrons pas les exceptions, mais les laissons plutôt remonter vers le haut
// niveau où l'environnement d'intégration (par exemple le navigateur) peut gérer
// eux.
// Cependant, sous v8 et node, nous quittons parfois directement le processus, auquel cas
// c'est à nous de nous servir de l'exception avant de sortir.
// Si nous corrigeons https://github.com/emscripten-core/emscripten/issues/15080
// cela n'est peut-être plus nécessaire sous node.
fonction logExceptionOnExit(e) {
  si (e instanceof ExitStatus) renvoie ;
  laissez toLog = e;
  si (e && typeof e == 'objet' && e.stack) {
    toLog = [e, e.stack];
  }
  err('sortie en raison d'une exception : ' + toLog);
}

var fs;
var chemin_noeud;
var requireNodeFS;

si (ENVIRONNEMENT_EST_NOEUD) {
  si (!(typeof process == 'object' && typeof require == 'function')) throw new Error('non compilé pour cet environnement (avez-vous compilé en HTML et essayé de l'exécuter en dehors du Web, ou défini ENVIRONNEMENT sur quelque chose - comme node - et l'avez-vous exécuté ailleurs - comme sur le Web ?)');
  si (ENVIRONNEMENT_EST_TRAVAILLEUR) {
    scriptDirectory = require('chemin').dirname(scriptDirectory) + '/';
  } autre {
    scriptDirectory = __dirname + '/';
  }

// inclure : node_shell_read.js


requireNodeFS = () => {
  // Utilisez nodePath comme indicateur pour ceux-ci qui ne sont pas initialisés,
  // car dans certains environnements, un système de fichiers global peut déjà avoir été
  // créé.
  si (!nodePath) {
    fs = require('fs');
    nodePath = require('chemin');
  }
};

read_ = fonction shell_read(nom de fichier, binaire) {
  requireNodeFS();
  nom de fichier = nodePath['normaliser'](nom de fichier);
  renvoie fs.readFileSync(nom de fichier, binaire ? undefined : 'utf8');
};

readBinary = (nom de fichier) => {
  var ret = read_(nom de fichier, vrai);
  si (!ret.buffer) {
    ret = nouveau Uint8Array(ret);
  }
  assert(ret.buffer);
  retour ret;
};

readAsync = (nom de fichier, onload, onerror) => {
  requireNodeFS();
  nom de fichier = nodePath['normaliser'](nom de fichier);
  fs.readFile(nom de fichier, fonction(err, données) {
    si (err) en erreur (err);
    sinon onload(data.buffer);
  });
};

// fin de l'inclusion : node_shell_read.js
  si (processus['argv'].length > 1) {
    ce programme = processus['argv'][1].replace(/\\/g, '/');
  }

  arguments_ = processus['argv'].slice(2);

  si (typeof module != 'undefined') {
    module['exportations'] = Module;
  }

  processus['on']('uncaughtException', fonction(ex) {
    // empêcher les exceptions ExitStatus d'afficher une erreur
    si (!(ex instanceof ExitStatus)) {
      lancer ex;
    }
  });

  // Sans cela, les anciennes versions de node (< v15) enregistreront les rejets non gérés
  // mais renvoie 0, ce qui n'est normalement pas le comportement souhaité. C'est
  // pas nécessaire avec node v15 et à propos car c'est maintenant la valeur par défaut
  // comportement:
  // Voir https://nodejs.org/api/cli.html#cli_unhandled_rejections_mode
  processus['on']('unhandledRejection', fonction(raison) { throw reason; });

  quit_ = (statut, toThrow) => {
    si (keepRuntimeAlive()) {
      processus['exitCode'] = état;
      lancer àJeter;
    }
    logExceptionOnExit(à lancer);
    processus['exit'](statut);
  };

  Module['inspect'] = function() { return '[Objet module Emscripten]'; };

} autre
si (ENVIRONNEMENT_EST_SHELL) {

  if ((typeof process == 'object' && typeof require === 'function') || typeof window == 'object' || typeof importScripts == 'function') throw new Error('non compilé pour cet environnement (avez-vous compilé en HTML et essayé de l'exécuter en dehors du Web, ou défini ENVIRONMENT sur quelque chose - comme node - et l'exécuter ailleurs - comme sur le Web ?)');

  si (typeof lu != 'undefined') {
    lire_ = fonction shell_read(f) {
      retourner lire(f);
    };
  }

  lireBinaire = fonction lireBinaire(f) {
    laisser des données;
    si (typeof readbuffer == 'fonction') {
      renvoyer un nouveau Uint8Array(readbuffer(f));
    }
    données = lecture(f, 'binaire');
    assert(typeof données == 'objet');
    renvoyer des données ;
  };

  readAsync = fonction readAsync(f, onload, onerror) {
    setTimeout(() => onload(readBinary(f)), 0);
  };

  si (typeof scriptArgs != 'undefined') {
    arguments_ = scriptArgs;
  } sinon si (typeof arguments != 'undefined') {
    arguments_ = arguments;
  }

  si (typeof quit == 'fonction') {
    quit_ = (statut, toThrow) => {
      logExceptionOnExit(à lancer);
      quitter(statut);
    };
  }

  si (typeof print != 'undefined') {
    // Préférez utiliser print/printErr lorsqu'ils existent, car ils fonctionnent généralement mieux.
    si (typeof console == 'undefined') console = /** @type{!Console} */({});
    console.log = /** @type{!function(this:Console, ...*): undefined} */ (print);
    console.warn = console.error = /** @type{!function(this:Console, ...*): undefined} */ (typeof printErr != 'undefined' ? printErr : print);
  }

} autre

// Notez que cela inclut les travailleurs Node.js lorsque cela est pertinent (pthreads est activé).
// Les travailleurs Node.js sont détectés comme une combinaison de ENVIRONMENT_IS_WORKER et
// ENVIRONNEMENT_EST_NOEUD.
si (ENVIRONNEMENT_EST_WEB || ENVIRONNEMENT_EST_TRAVAILLEUR) {
  si (ENVIRONMENT_IS_WORKER) { // Vérifiez le travailleur, pas le Web, car la fenêtre pourrait être polyremplie
    scriptDirectory = self.location.href;
  } else if (typeof document != 'undefined' && document.currentScript) { // web
    scriptDirectory = document.currentScript.src;
  }
  // les URL blob ressemblent à blob:http://site.com/etc/etc et nous ne pouvons rien en déduire.
  // sinon, coupez la partie finale de l'URL pour trouver le répertoire du script.
  // si scriptDirectory ne contient pas de barre oblique, lastIndexOf renverra -1,
  // et scriptDirectory sera correctement remplacé par une chaîne vide.
  // Si scriptDirectory contient une requête (commençant par ?) ou un fragment (commençant par #),
  // ils sont supprimés car ils pourraient contenir une barre oblique.
  si (scriptDirectory.indexOf('blob:') !== 0) {
    scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf('/')+1);
  } autre {
    scriptDirectory = '';
  }

  si (!(typeof window == 'object' || typeof importScripts == 'function')) throw new Error('non compilé pour cet environnement (avez-vous compilé en HTML et essayé de l'exécuter en dehors du Web, ou défini ENVIRONNEMENT sur quelque chose - comme node - et l'avez-vous exécuté ailleurs - comme sur le Web ?)');

  // Différenciez le cas du Web Worker du Node Worker, car la lecture doit
  // être fait différemment.
  {
// inclure : web_or_worker_shell_read.js


  lire_ = (url) => {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.envoyer(null);
      renvoyer xhr.responseText;
  }

  si (ENVIRONNEMENT_EST_TRAVAILLEUR) {
    lireBinaire = (url) => {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, false);
        xhr.responseType = 'tableautampon';
        xhr.envoyer(null);
        renvoyer un nouveau Uint8Array(/** @type{!ArrayBuffer} */(xhr.response));
    };
  }

  readAsync = (url, onload, onerror) => {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'tableautampon';
    xhr.onload = () => {
      si (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // les URL de fichiers peuvent renvoyer 0
        onload(xhr.réponse);
        retour;
      }
      en erreur();
    };
    xhr.onerror = onerror;
    xhr.envoyer(null);
  }

// fin de l'inclusion : web_or_worker_shell_read.js
  }

  setWindowTitle = (titre) => document.title = titre;
} autre
{
  throw new Error('erreur de détection d'environnement');
}

var out = Module['print'] || console.log.bind(console);
var err = Module['printErr'] || console.warn.bind(console);

// Fusionner à nouveau dans les remplacements
Objet.assign(Module, moduleOverrides);
// Libérez la hiérarchie d'objets contenue dans les remplacements, cela permet au GC
// récupérer les données utilisées par exemple dans memoryInitializerRequest, qui est un grand tableau typé.
moduleOverrides = null;
checkIncomingModuleAPI();

// Émet du code pour gérer les valeurs attendues sur l'objet Module. Cela s'applique à Module.x
// au x local approprié. Cela présente deux avantages : tout d'abord, nous ne l'émettons que s'il est
// devrait arriver, et deuxièmement, en utilisant un local partout ailleurs qui peut être
// minifié.

si (Module['arguments']) arguments_ = Module['arguments'];legacyModuleProp('arguments', 'arguments_');

si (Module['ceProgramme']) ceProgramme = Module['ceProgramme'];legacyModuleProp('ceProgramme', 'ceProgramme');

si (Module['quit']) quit_ = Module['quit'];legacyModuleProp('quit', 'quit_');

// effectuer des assertions dans shell.js après avoir configuré out() et err(), sinon, si une assertion échoue, elle ne peut pas imprimer le message
// Assertions sur les API JS de module entrantes supprimées.
assert(typeof Module['memoryInitializerPrefixURL'] == 'undefined', 'L'option Module.memoryInitializerPrefixURL a été supprimée, utilisez plutôt Module.locateFile');
assert(typeof Module['pthreadMainPrefixURL'] == 'undefined', 'L'option Module.pthreadMainPrefixURL a été supprimée, utilisez plutôt Module.locateFile');
assert(typeof Module['cdInitializerPrefixURL'] == 'undefined', 'L'option Module.cdInitializerPrefixURL a été supprimée, utilisez plutôt Module.locateFile');
assert(typeof Module['filePackagePrefixURL'] == 'undefined', 'L'option Module.filePackagePrefixURL a été supprimée, utilisez plutôt Module.locateFile');
assert(typeof Module['read'] == 'undefined', 'L'option Module.read a été supprimée (modifier read_ dans JS)');
assert(typeof Module['readAsync'] == 'undefined', 'L'option Module.readAsync a été supprimée (modifier readAsync dans JS)');
assert(typeof Module['readBinary'] == 'undefined', 'L'option Module.readBinary a été supprimée (modifier readBinary dans JS)');
assert(typeof Module['setWindowTitle'] == 'undefined', 'L'option Module.setWindowTitle a été supprimée (modifier setWindowTitle dans JS)');
assert(typeof Module['TOTAL_MEMORY'] == 'undefined', 'Module.TOTAL_MEMORY a été renommé Module.INITIAL_MEMORY');
legacyModuleProp('lire', 'lire_');
legacyModuleProp('readAsync', 'readAsync');
legacyModuleProp('readBinary', 'readBinary');
LegacyModuleProp('setWindowTitle', 'setWindowTitle');
var IDBFS = 'IDBFS n'est plus inclus par défaut ; compiler avec -lidbfs.js';
var PROXYFS = 'PROXYFS n'est plus inclus par défaut ; compiler avec -lproxyfs.js';
var WORKERFS = 'WORKERFS n'est plus inclus par défaut ; compiler avec -lworkerfs.js';
var NODEFS = 'NODEFS n'est plus inclus par défaut ; compiler avec -lnodefs.js';


assert(!ENVIRONMENT_IS_SHELL, "environnement shell détecté mais non activé au moment de la construction. Ajoutez 'shell' à `-s ENVIRONMENT` pour l'activer.");




var STACK_ALIGN = 16;
var POINTER_SIZE = 4;

fonction getNativeTypeSize(type) {
  commutateur (type) {
    cas 'i1' : cas 'i8' : retour 1 ;
    cas 'i16' : retour 2 ;
    cas 'i32' : retour 4 ;
    cas 'i64' : retour 8 ;
    cas 'float' : retour 4 ;
    cas 'double' : retour 8 ;
    défaut: {
      si (type[type.length - 1] === '*') {
        retourner POINTER_SIZE;
      } sinon si (type[0] === 'i') {
        const bits = Nombre(type.substr(1));
        assert(bits % 8 === 0, 'getNativeTypeSize bits non valides ' + bits + ', type ' + type);
        retourner les bits / 8;
      } autre {
        retourner 0;
      }
    }
  }
}

fonction warnOnce(texte) {
  si (!warnOnce.shown) warnOnce.shown = {};
  si (!warnOnce.shown[texte]) {
    warnOnce.shown[texte] = 1;
    err(texte);
  }
}

// inclure : runtime_functions.js


// Encapsule une fonction JS en tant que fonction wasm avec une signature donnée.
fonction convertJsFunctionToWasm(func, sig) {

  // Si la proposition de réflexion de type est disponible, utilisez la nouvelle
  // Constructeur "WebAssembly.Function".
  // Sinon, construisez un module wasm minimal important la fonction JS et
  // le réexporter.
  si (typeof WebAssembly.Function == "fonction") {
    var typeNames = {
      'i': 'i32',
      'j': 'i64',
      'f': 'f32',
      'd': 'f64'
    };
    var type = {
      paramètres : [],
      résultats : sig[0] == 'v' ? [] : [typeNames[sig[0]]]
    };
    pour (var i = 1; i < sig.length; ++i) {
      type.parameters.push(typeNames[sig[i]]);
    }
    renvoyer un nouveau WebAssembly.Function(type, func);
  }

  // Le module est statique, à l'exception de la section type, qui est
  // généré sur la base de la signature transmise.
  var typeSection = [
    0x01, // identifiant : section,
    0x00, // longueur : 0 (espace réservé)
    0x01, // compte : 1
    0x60, // formulaire : fonction
  ];
  var sigRet = sig.slice(0, 1);
  var sigParam = sig.slice(1);
  var typeCodes = {
    'i': 0x7f, // i32
    'j': 0x7e, // i64
    'f': 0x7d, // f32
    'd': 0x7c, // f64
  };

  // Paramètres, longueur + signatures
  typeSection.push(sigParam.length);
  pour (var i = 0; i < sigParam.length; ++i) {
    typeSection.push(typeCodes[sigParam[i]]);
  }

  // Valeurs de retour, longueur + signatures
  // Sans retour multiple dans MVP, soit 0 (vide) soit 1 (autre chose)
  si (sigRet == 'v') {
    typeSection.push(0x00);
  } autre {
    typeSection = typeSection.concat([0x01, typeCodes[sigRet]]);
  }

  // Réécrivez la longueur totale de la section de type dans l'en-tête de la section
  // (à l'exception des 2 octets pour l'identifiant et la longueur de la section)
  typeSection[1] = typeSection.length - 2;

  // Le reste du module est statique
  var octets = nouveau Uint8Array([
    0x00, 0x61, 0x73, 0x6d, // magie ("\0asm")
    0x01, 0x00, 0x00, 0x00, // version : 1
  ].concat(typeSection, [
    0x02, 0x07, // section d'importation
      // (importer "e" "f" (fonction 0 (type 0)))
      0x01, 0x01, 0x65, 0x01, 0x66, 0x00, 0x00,
    0x07, 0x05, // section d'exportation
      // (exporter "f" (fonction 0 (type 0)))
      0x01, 0x01, 0x66, 0x00, 0x00,
  ]));

   // Nous pouvons compiler ce module wasm de manière synchrone car il est très petit.
  // Ceci accepte une importation (à « ef »), qu'il redirige vers une exportation (à « f »)
  var module = new WebAssembly.Module(octets);
  var instance = nouveau WebAssembly.Instance(module, {
    'e': {
      'f': fonction
    }
  });
  var wrappedFunc = instance.exports['f'];
  retourner wrappedFunc;
}

var freeTableIndexes = [];

// Carte faible des fonctions de la table vers leurs index, créée lors de la première utilisation.
var fonctionsInTableMap;

fonction getEmptyTableSlot() {
  // Réutiliser un index libre s'il y en a un, sinon développer.
  si (freeTableIndexes.length) {
    renvoie freeTableIndexes.pop();
  }
  // Agrandir la table
  essayer {
    wasmTable.grow(1);
  } attraper (errer) {
    si (!(err instanceof RangeError)) {
      jeter une erreur;
    }
    throw 'Impossible de développer la table wasm. Définissez ALLOW_TABLE_GROWTH.';
  }
  renvoie wasmTable.length - 1;
}

fonction updateTableMap(décalage, nombre) {
  pour (var i = décalage; i < décalage + nombre; i++) {
    var élément = getWasmTableEntry(i);
    // Ignorer les valeurs nulles.
    si (élément) {
      fonctionsInTableMap.set(élément, i);
    }
  }
}

/**
 * Ajouter une fonction au tableau.
 * Le paramètre 'sig' est requis si la fonction ajoutée est une fonction JS.
 * @param {string=} sig
 */
fonction addFunction(func, sig) {
  assert(typeof func != 'undefined');

  // Vérifiez si la fonction est déjà dans la table, pour garantir que chaque fonction
  // obtient un index unique. Tout d'abord, créez la carte s'il s'agit de la première utilisation.
  si (!functionsInTableMap) {
    fonctionsInTableMap = new WeakMap();
    updateTableMap(0, wasmTable.length);
  }
  si (functionsInTableMap.has(func)) {
    renvoie les fonctionsInTableMap.get(func);
  }

  // Ce n'est pas dans le tableau, ajoutez-le maintenant.

  var ret = getEmptyTableSlot();

  // Définir la nouvelle valeur.
  essayer {
    // Tenter d'appeler ceci avec la fonction JS entraînera l'échec de table.set()
    setWasmTableEntry(ret, fonction);
  } attraper (errer) {
    if (!(erreur instanceof TypeError)) {
      jeter une erreur;
    }
    assert(typeof sig != 'undefined', 'Argument de signature manquant pour addFunction : ' + func);
    var enveloppé = convertJsFunctionToWasm(func, sig);
    setWasmTableEntry(ret, enveloppé);
  }

  fonctionsInTableMap.set(func, ret);

  retour ret;
}

fonction removeFunction(index) {
  fonctionsInTableMap.delete(getWasmTableEntry(index));
  freeTableIndexes.push(index);
}

// fin de l'inclusion : runtime_functions.js
// inclure : runtime_debug.js


fonction legacyModuleProp(prop, nouveauNom) {
  si (!Object.getOwnPropertyDescriptor(Module, prop)) {
    Objet.defineProperty(Module, prop, {
      configurable : vrai,
      obtenir : fonction() {
        abort('Module.' + prop + ' a été remplacé par plain ' + newName + ' (la valeur initiale peut être fournie sur Module, mais après le démarrage, la valeur n'est recherchée que sur une variable locale de ce nom)');
      }
    });
  }
}

fonction ignoréeModuleProp(prop) {
  si (Object.getOwnPropertyDescriptor(Module, prop)) {
    abort('`Module.' + prop + '` a été fourni mais `' + prop + '` n'est pas inclus dans INCOMING_MODULE_JS_API');
  }
}

fonction non exportéeMessage(sym, isFSSybol) {
  var msg = "'" + sym + "' n'a pas été exporté. ajoutez-le à EXPORTED_RUNTIME_METHODS (voir la FAQ)";
  si (isFSSybol) {
    msg += '. Alternativement, forcer la prise en charge du système de fichiers (-s FORCE_FILESYSTEM=1) peut exporter ceci pour vous';
  }
  message de retour;
}

fonction non exportéeRuntimeSymbol(sym, isFSSybol) {
  si (!Object.getOwnPropertyDescriptor(Module, sym)) {
    Objet.defineProperty(Module, sym, {
      configurable : vrai,
      obtenir : fonction() {
        abandonner(unexportedMessage(sym, isFSSybol));
      }
    });
  }
}

fonction non exportéeRuntimeFunction(sym, isFSSybol) {
  si (!Object.getOwnPropertyDescriptor(Module, sym)) {
    Module[sym] = () => abort(unexportedMessage(sym, isFSSybol));
  }
}

// fin de l'inclusion : runtime_debug.js
var tempRet0 = 0;
var setTempRet0 = (valeur) => { tempRet0 = valeur ; } ;
var getTempRet0 = () => tempRet0;



// === Éléments de la bibliothèque de préambule ===

// La documentation des API publiques définies dans ce fichier doit être mise à jour dans :
// site/source/docs/api_reference/preamble.js.rst
// Une version locale prédéfinie de la documentation est disponible à l'adresse :
// site/build/text/docs/api_reference/preamble.js.txt
// Vous pouvez également créer des documents localement au format HTML ou d'autres formats sur le site/
// Une version HTML en ligne (qui peut être d'une version différente d'Emscripten)
// est disponible sur http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html

var wasmBinary;
si (Module['wasmBinary']) wasmBinary = Module['wasmBinary'];legacyModuleProp('wasmBinary', 'wasmBinary');
var noExitRuntime = Module['noExitRuntime'] || true;legacyModuleProp('noExitRuntime', 'noExitRuntime');

si (typeof WebAssembly != 'objet') {
  abort('aucun support wasm natif détecté');
}

// inclure : runtime_safe_heap.js


// Dans MINIMAL_RUNTIME, setValue() et getValue() ne sont disponibles que lors de la construction avec le tas sécurisé activé, pour la vérification de la sécurité du tas.
// Dans l'exécution traditionnelle, setValue() et getValue() sont toujours disponibles (bien que leur utilisation soit fortement déconseillée en raison des pénalités de performances)

/** @param {numéro} ptr
    @param {nombre} valeur
    @param {chaîne} type
    @param {numéro|booléen=} noSafe */
fonction setValue(ptr, valeur, type = 'i8', noSafe) {
  si (type.charAt(type.length-1) === '*') type = 'i32';
    commutateur (type) {
      cas 'i1' : HEAP8[((ptr)>>0)] = valeur ; pause ;
      cas 'i8' : HEAP8[((ptr)>>0)] = valeur ; pause ;
      cas 'i16' : HEAP16[((ptr)>>1)] = valeur ; pause ;
      cas 'i32' : HEAP32[((ptr)>>2)] = valeur ; pause ;
      cas 'i64' : (tempI64 = [valeur>>>0,(tempDouble=valeur,(+(Math.abs(tempDouble))) >= 1,0 ? (tempDouble > 0,0 ? ((Math.min((+(Math.floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((ptr)>>2)] = tempI64[0],HEAP32[(((ptr)+(4))>>2)] = tempI64[1]); pause;
      cas 'float' : HEAPF32[((ptr)>>2)] = valeur ; break ;
      cas 'double' : HEAPF64[((ptr)>>3)] = valeur ; pause ;
      par défaut : abort('type non valide pour setValue : ' + type);
    }
}

/** @param {numéro} ptr
    @param {chaîne} type
    @param {numéro|booléen=} noSafe */
fonction getValue(ptr, type = 'i8', noSafe) {
  si (type.charAt(type.length-1) === '*') type = 'i32';
    commutateur (type) {
      cas 'i1' : retour HEAP8[((ptr)>>0)] ;
      cas 'i8' : retour HEAP8[((ptr)>>0)] ;
      cas 'i16' : retour HEAP16[((ptr)>>1)] ;
      cas 'i32' : retour HEAP32[((ptr)>>2)] ;
      cas 'i64' : retour HEAP32[((ptr)>>2)] ;
      cas 'float' : retour HEAPF32[((ptr)>>2)] ;
      cas 'double' : retour Number(HEAPF64[((ptr)>>3)]);
      par défaut : abort('type non valide pour getValue : ' + type);
    }
  retourner null;
}

// fin de l'inclusion : runtime_safe_heap.js
// Variables globales Wasm

var wasmMémoire;

//========================================
// Principes essentiels de l'exécution
//========================================

// si nous quittons l'application. aucun code ne devrait s'exécuter après cela.
// définir dans exit() et abort()
var ABORT = faux;

// défini par exit() et abort(). Passé au gestionnaire 'onExit'.
// REMARQUE : ceci est également utilisé comme code de retour de processus dans les environnements shell
// mais seulement lorsque noExitRuntime est faux.
var EXITSTATUS;

/** @type {fonction(*, chaîne=)} */
fonction assert(condition, texte) {
  si (!condition) {
    abort('Assertion échouée' + (texte ? ': ' + texte : ''));
  }
}

// Renvoie la fonction C avec un identifiant spécifié (pour C++, vous devez effectuer une modification manuelle du nom)
fonction getCFunc(ident) {
  var func = Module['_' + ident]; // fermeture de la fonction exportée
  assert(func, 'Impossible d'appeler une fonction inconnue ' + ident + ', assurez-vous qu'elle est exportée');
  fonction de retour ;
}

// Interface d'appel C.
/** @param {string|null=} type de retour
    @param {Array=} argTypes
    @param {Arguments|Array=} args
    @param {Object=} options */
fonction ccall(ident, returnType, argTypes, args, opts) {
  // Pour une recherche rapide des fonctions de conversion
  var toC = {
    'chaîne': fonction(str) {
      var ret = 0;
      si (str !== null && str !== indéfini && str !== 0) { // chaîne nulle
        // au plus 4 octets par point de code UTF-8, +1 pour le '\0' de fin
        var len = (str.length << 2) + 1;
        ret = stackAlloc(len);
        chaîneToUTF8(str, ret, len);
      }
      retour ret;
    },
    'tableau' : fonction(arr) {
      var ret = stackAlloc(arr.length);
      writeArrayToMemory(arr, ret);
      retour ret;
    }
  };

  fonction convertReturnValue(ret) {
    si (returnType === 'string') renvoie UTF8ToString(ret);
    si (returnType === 'boolean') renvoie Boolean(ret);
    retour ret;
  }

  var func = getCFunc(ident);
  var cArgs = [];
  var pile = 0;
  assert(returnType !== 'array', 'Le type de retour ne doit pas être « array ».');
  si (args) {
    pour (var i = 0; i < args.length; i++) {
      var convertisseur = toC[argTypes[i]];
      si (convertisseur) {
        si (pile === 0) pile = pileEnregistrer();
        cArgs[i] = convertisseur(args[i]);
      } autre {
        cArgs[i] = args[i];
      }
    }
  }
  var ret = func.apply(null, cArgs);
  fonction onDone(ret) {
    si (pile !== 0) stackRestore(pile);
    return convertReturnValue(ret);
  }

  ret = onDone(ret);
  retour ret;
}

/** @param {string=} type de retour
    @param {Array=} argTypes
    @param {Object=} options */
fonction cwrap(ident, returnType, argTypes, opts) {
  fonction de retour() {
    renvoyer ccall(ident, returnType, argTypes, arguments, opts);
  }
}

// Nous avions l'habitude d'inclure malloc/free par défaut dans le passé. Afficher une erreur utile dans
// construit avec des assertions.

// inclure : runtime_legacy.js


var ALLOC_NORMAL = 0; // Essaie d'utiliser _malloc()
var ALLOC_STACK = 1; // Vit pendant la durée de l'appel de fonction en cours

/**
 * allocate() : Cette fonction n'est plus utilisée par emscripten mais est conservée pour éviter
 * briser les utilisateurs externes.
 * Vous ne devez normalement pas utiliser allocate(), mais plutôt allouer
 * mémoire utilisant _malloc()/stackAlloc(), initialisez-la avec
 * setValue(), et ainsi de suite.
 * @param {(Uint8Array|Array<number>)} slab : un tableau de données.
 * @param {number=} allocator : Comment allouer de la mémoire, voir ALLOC_*
 */
fonction allocate(dalle, allocateur) {
  var ret;
  assert(typeof allocator == 'number', 'allocate ne prend plus d'argument de type')
  assert(typeof slab != 'number', 'allocate ne prend plus de numéro comme arg0')

  si (allocateur == ALLOC_STACK) {
    ret = stackAlloc(dalle.longueur);
  } autre {
    ret = _malloc(dalle.longueur);
  }

  si (!slab.subarray && !slab.slice) {
    dalle = nouveau Uint8Array(dalle);
  }
  HEAPU8.set(dalle, ret);
  retour ret;
}

// fin de l'inclusion : runtime_legacy.js
// inclure : runtime_strings.js


// runtime_strings.js : fonctions d'exécution liées aux chaînes qui font partie à la fois de MINIMAL_RUNTIME et de l'exécution normale.

var UTF8Decoder = typeof TextDecoder != 'undefined' ? new TextDecoder('utf8') : undefined;

// Étant donné un pointeur 'ptr' vers une chaîne codée en UTF8 terminée par null dans le tableau donné qui contient des valeurs uint8, renvoie
// une copie de cette chaîne sous forme d'objet String Javascript.
/**
 * heapOrArray est soit un tableau normal, soit une vue de tableau typée JavaScript.
 * @param {numéro} idx
 * @param {nombre=} maxBytesToRead
 * @return {chaîne}
 */
fonction UTF8ArrayToString(tasOrArray, idx, maxBytesToRead) {
  var endIdx = idx + maxBytesToRead ;
  var endPtr = idx;
  // TextDecoder doit connaître la longueur des octets à l'avance, il ne s'arrête pas sur le terminateur nul par lui-même.
  // Utilisez également les informations de longueur pour éviter d'exécuter de petites chaînes via TextDecoder, car .subarray() alloue des données inutiles.
  // (En guise de petite astuce pour économiser du code, comparez endPtr à endIdx en utilisant une négation, de sorte que undefined signifie Infinity)
  tandis que (tasOuTableau[endPtr] && !(endPtr >= endIdx)) ++endPtr;

  si (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
    renvoie UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
  } autre {
    var str = '';
    // Si vous construisez avec TextDecoder, nous avons déjà calculé la longueur de la chaîne ci-dessus, donc testez la condition de fin de la boucle par rapport à cela
    tandis que (idx < endPtr) {
      // Pour la structure d'octets UTF8, voir :
      // http://en.wikipedia.org/wiki/UTF-8#Description
      // https://www.ietf.org/rfc/rfc2279.txt
      // https://tools.ietf.org/html/rfc3629
      var u0 = tasOuTableau[idx++];
      si (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
      var u1 = tasOrArray[idx++] & 63;
      si ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continuer; }
      var u2 = tasOrArray[idx++] & 63;
      si ((u0 & 0xF0) == 0xE0) {
        u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
      } autre {
        si ((u0 & 0xF8) != 0xF0) warnOnce('Octet de début UTF-8 non valide 0x' + u0.toString(16) + ' rencontré lors de la désérialisation d'une chaîne UTF-8 dans la mémoire wasm en une chaîne JS !');
        u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63);
      }

      si (u0 < 0x10000) {
        str += Chaîne.fromCharCode(u0);
      } autre {
        var ch = u0 - 0x10000;
        str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
      }
    }
  }
  retourner str;
}

// Étant donné un pointeur 'ptr' vers une chaîne codée en UTF8 terminée par null dans le tas emscripten, renvoie un
// copie de cette chaîne sous forme d'objet String Javascript.
// maxBytesToRead : une longueur facultative qui spécifie le nombre maximal d'octets à lire. Vous pouvez omettre
// ce paramètre permet d'analyser la chaîne jusqu'au premier octet \0. Si maxBytesToRead est
// passé, et la chaîne à [ptr, ptr+maxBytesToReadr[ contient un octet nul dans le
// milieu, alors la chaîne sera coupée à cet index d'octet (c'est-à-dire que maxBytesToRead sera
// ne produit pas de chaîne de longueur exacte [ptr, ptr+maxBytesToRead[)
// NB mélanger les utilisations fréquentes de UTF8ToString() avec et sans maxBytesToRead peut
// jetez les optimisations JS JIT, il vaut donc la peine d'envisager d'en utiliser systématiquement une
// style ou autre.
/**
 * @param {numéro} ptr
 * @param {nombre=} maxBytesToRead
 * @return {chaîne}
 */
fonction UTF8ToString(ptr, maxBytesToRead) {
  ;
  retourner ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : '';
}

// Copie l'objet de chaîne Javascript donné 'str' dans le tableau d'octets donné à l'adresse 'outIdx',
// codé au format UTF8 et terminé par un caractère nul. La copie nécessitera au plus str.length*4+1 octets d'espace dans le TAS.
// Utilisez la fonction lengthBytesUTF8 pour calculer le nombre exact d'octets (à l'exclusion du terminateur nul) que cette fonction écrira.
// Paramètres :
// str : la chaîne Javascript à copier.
// tas : le tableau vers lequel copier. Chaque index de ce tableau est supposé être un élément de 8 octets.
// outIdx : le décalage de départ dans le tableau pour commencer la copie.
// maxBytesToWrite : le nombre maximal d'octets que cette fonction peut écrire dans le tableau.
// Ce décompte doit inclure le terminateur nul,
// c'est-à-dire que si maxBytesToWrite=1, seul le terminateur nul sera écrit et rien d'autre.
// maxBytesToWrite=0 n'écrit aucun octet sur la sortie, pas même le terminateur nul.
// Renvoie le nombre d'octets écrits, À L'EXCLUSION du terminateur nul.

fonction chaîneToUTF8Array(str, tas, outIdx, maxBytesToWrite) {
  if (!(maxBytesToWrite > 0)) // Le paramètre maxBytesToWrite n'est pas facultatif. Les valeurs négatives, 0, null, undefined et false n'écrivent aucun octet.
    retourner 0;

  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1; // -1 pour le terminateur nul de chaîne.
  pour (var i = 0; i < str.length; ++i) {
    // Gotcha : charCodeAt renvoie un mot de 16 bits qui est une unité de code encodée en UTF-16, et non un point de code Unicode du caractère ! Décodez donc UTF16->UTF32->UTF8.
    // Voir http://unicode.org/faq/utf_bom.html#utf16-3
    // Pour la structure des octets UTF8, voir http://en.wikipedia.org/wiki/UTF-8#Description et https://www.ietf.org/rfc/rfc2279.txt et https://tools.ietf.org/html/rfc3629
    var u = str.charCodeAt(i); // éventuellement un substitut principal
    si (u >= 0xD800 && u <= 0xDFFF) {
      var u1 = str.charCodeAt(++i);
      u = 0x10000 + ((u & 0x3FF) << 10) | (u1 & 0x3FF);
    }
    si (u <= 0x7F) {
      si (outIdx >= endIdx) pause ;
      tas[outIdx++] = u;
    } sinon si (u <= 0x7FF) {
      si (outIdx + 1 >= endIdx) pause ;
      tas[outIdx++] = 0xC0 | (u >> 6);
      tas[outIdx++] = 0x80 | (u & 63);
    } sinon si (u <= 0xFFFF) {
      si (outIdx + 2 >= endIdx) pause ;
      tas[outIdx++] = 0xE0 | (u >> 12);
      tas[outIdx++] = 0x80 | ((u >> 6) & 63);
      tas[outIdx++] = 0x80 | (u & 63);
    } autre {
      si (outIdx + 3 >= endIdx) pause ;
      si (u > 0x10FFFF) warnOnce('Point de code Unicode non valide 0x' + u.toString(16) + ' rencontré lors de la sérialisation d'une chaîne JS en une chaîne UTF-8 dans la mémoire wasm ! (Les points de code Unicode valides doivent être compris entre 0 et 0x10FFFF).');
      tas[outIdx++] = 0xF0 | (u >> 18);
      tas[outIdx++] = 0x80 | ((u >> 12) & 63);
      tas[outIdx++] = 0x80 | ((u >> 6) & 63);
      tas[outIdx++] = 0x80 | (u & 63);
    }
  }
  // Termine par null le pointeur vers le tampon.
  tas[outIdx] = 0;
  renvoyer outIdx - startIdx ;
}

// Copie l'objet de chaîne Javascript donné 'str' dans le tas emscripten à l'adresse 'outPtr',
// terminé par null et codé au format UTF8. La copie nécessitera au plus str.length*4+1 octets d'espace dans le TAS.
// Utilisez la fonction lengthBytesUTF8 pour calculer le nombre exact d'octets (à l'exclusion du terminateur nul) que cette fonction écrira.
// Renvoie le nombre d'octets écrits, À L'EXCLUSION du terminateur nul.

fonction chaîneToUTF8(str, outPtr, maxBytesToWrite) {
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF8(str, outPtr, maxBytesToWrite) manque le troisième paramètre qui spécifie la longueur du tampon de sortie !');
  renvoyer chaîneToUTF8Array(str, HEAPU8,outPtr, maxBytesToWrite);
}

// Renvoie le nombre d'octets que prend la chaîne Javascript donnée si elle est encodée sous forme de tableau d'octets UTF8, À L'EXCLUSION de l'octet de terminaison nul.
fonction longueurBytesUTF8(str) {
  var longueur = 0;
  pour (var i = 0; i < str.length; ++i) {
    // Gotcha : charCodeAt renvoie un mot de 16 bits qui est une unité de code encodée en UTF-16, et non un point de code Unicode du caractère ! Décodez donc UTF16->UTF32->UTF8.
    // Voir http://unicode.org/faq/utf_bom.html#utf16-3
    var u = str.charCodeAt(i); // éventuellement un substitut principal
    si (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
    si (u <= 0x7F) ++len;
    sinon si (u <= 0x7FF) len += 2 ;
    sinon si (u <= 0xFFFF) len += 3;
    sinon len += 4;
  }
  retourner len;
}

// fin de l'inclusion : runtime_strings.js
// inclure : runtime_strings_extra.js


// runtime_strings_extra.js : fonctions d'exécution liées aux chaînes qui ne sont disponibles que dans l'exécution normale.

// Étant donné un pointeur 'ptr' vers une chaîne codée ASCII terminée par un caractère nul dans le tas emscripten, renvoie
// une copie de cette chaîne sous forme d'objet String Javascript.

fonction AsciiToString(ptr) {
  var str = '';
  tandis que (1) {
    var ch = HEAPU8[((ptr++)>>0)];
    si (!ch) renvoie str;
    str += Chaîne.fromCharCode(ch);
  }
}

// Copie l'objet de chaîne Javascript donné 'str' dans le tas emscripten à l'adresse 'outPtr',
// terminé par null et codé au format ASCII. La copie nécessitera au plus str.length+1 octets d'espace dans le TAS.

fonction chaîneToAscii(str, outPtr) {
  renvoyer writeAsciiToMemory(str, outPtr, false);
}

// Étant donné un pointeur 'ptr' vers une chaîne codée en UTF16LE terminée par un caractère nul dans le tas emscripten, renvoie
// une copie de cette chaîne sous forme d'objet String Javascript.

var UTF16Decoder = typeof TextDecoder != 'undefined' ? new TextDecoder('utf-16le') : undefined;

fonction UTF16ToString(ptr, maxBytesToRead) {
  assert(ptr % 2 == 0, 'Le pointeur passé à UTF16ToString doit être aligné sur deux octets !');
  var endPtr = ptr;
  // TextDecoder doit connaître la longueur des octets à l'avance, il ne s'arrête pas sur le terminateur nul par lui-même.
  // Utilisez également les informations de longueur pour éviter d'exécuter de petites chaînes via TextDecoder, car .subarray() alloue des données inutiles.
  var idx = endPtr >> 1;
  var maxIdx = idx + maxBytesToRead / 2 ;
  // Si maxBytesToRead n'est pas transmis explicitement, il sera indéfini, et ceci
  // sera toujours évalué à vrai. Cela permet d'économiser la taille du code.
  tandis que (!(idx >= maxIdx) && HEAPU16[idx]) ++idx;
  finPtr = idx << 1;

  si (endPtr - ptr > 32 && Décodeur UTF16) {
    renvoie UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
  } autre {
    var str = '';

    // Si maxBytesToRead n'est pas passé explicitement, il sera indéfini et la condition de la boucle for
    // sera toujours évalué à vrai. La boucle se termine ensuite sur le premier caractère nul.
    pour (var i = 0; !(i >= maxBytesToRead / 2); ++i) {
      var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
      si (codeUnit == 0) pause ;
      // fromCharCode construit un caractère à partir d'une unité de code UTF-16, nous pouvons donc transmettre la chaîne UTF16 directement.
      str += String.fromCharCode(codeUnit);
    }

    retourner str;
  }
}

// Copie l'objet de chaîne Javascript donné 'str' dans le tas emscripten à l'adresse 'outPtr',
// terminé par null et codé au format UTF16. La copie nécessitera au plus str.length*4+2 octets d'espace dans le TAS.
// Utilisez la fonction lengthBytesUTF16() pour calculer le nombre exact d'octets (à l'exclusion du terminateur nul) que cette fonction écrira.
// Paramètres :
// str : la chaîne Javascript à copier.
// outPtr : adresse d'octet dans le tas Emscripten où écrire la chaîne.
// maxBytesToWrite : nombre maximal d'octets que cette fonction peut écrire dans le tableau. Ce nombre doit inclure la valeur null
// terminateur, c'est-à-dire que si maxBytesToWrite=2, seul le terminateur nul sera écrit et rien d'autre.
// maxBytesToWrite<2 n'écrit aucun octet sur la sortie, pas même le terminateur nul.
// Renvoie le nombre d'octets écrits, À L'EXCLUSION du terminateur nul.

fonction chaîneToUTF16(str, outPtr, maxBytesToWrite) {
  assert(outPtr % 2 == 0, 'Le pointeur passé à stringToUTF16 doit être aligné sur deux octets !');
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF16(str, outPtr, maxBytesToWrite) manque le troisième paramètre qui spécifie la longueur du tampon de sortie !');
  // Compatibilité descendante : si le nombre maximal d'octets n'est pas spécifié, supposer que l'écriture illimitée non sécurisée est autorisée.
  si (maxBytesToWrite === indéfini) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  si (maxBytesToWrite < 2) renvoie 0 ;
  maxBytesToWrite -= 2; // Terminateur nul.
  var startPtr = outPtr;
  var numCharsToWrite = (maxBytesToWrite < str.length*2) ? (maxBytesToWrite / 2) : str.length;
  pour (var i = 0; i < numCharsToWrite; ++i) {
    // charCodeAt renvoie une unité de code codée en UTF-16, elle peut donc être directement écrite dans le HEAP.
    var codeUnit = str.charCodeAt(i); // éventuellement un substitut principal
    HEAP16[((outPtr)>>1)] = codeUnit;
    sortiePtr += 2;
  }
  // Termine par null le pointeur vers le TAS.
  HEAP16[((outPtr)>>1)] = 0;
  retourner outPtr - startPtr;
}

// Renvoie le nombre d'octets que la chaîne Javascript donnée prend si elle est encodée sous forme de tableau d'octets UTF16, À L'EXCLUSION de l'octet de terminaison nul.

fonction lengthBytesUTF16(str) {
  retourner str.length*2;
}

fonction UTF32ToString(ptr, maxBytesToRead) {
  assert(ptr % 4 == 0, 'Le pointeur passé à UTF32ToString doit être aligné sur quatre octets !');
  var i = 0;

  var str = '';
  // Si maxBytesToRead n'est pas transmis explicitement, il sera indéfini, et ceci
  // sera toujours évalué à vrai. Cela permet d'économiser la taille du code.
  tant que (!(i >= maxBytesToRead / 4)) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    si (utf32 == 0) pause ;
    ++i;
    // Gotcha : fromCharCode construit un caractère à partir d'un code encodé en UTF-16 (paire), et non à partir d'un point de code Unicode ! Encodez donc le point de code en UTF-16 pour la construction.
    // Voir http://unicode.org/faq/utf_bom.html#utf16-3
    si (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } autre {
      str += Chaîne.fromCharCode(utf32);
    }
  }
  retourner str;
}

// Copie l'objet de chaîne Javascript donné 'str' dans le tas emscripten à l'adresse 'outPtr',
// terminé par null et codé au format UTF32. La copie nécessitera au plus str.length*4+4 octets d'espace dans le TAS.
// Utilisez la fonction lengthBytesUTF32() pour calculer le nombre exact d'octets (à l'exclusion du terminateur nul) que cette fonction écrira.
// Paramètres :
// str : la chaîne Javascript à copier.
// outPtr : adresse d'octet dans le tas Emscripten où écrire la chaîne.
// maxBytesToWrite : nombre maximal d'octets que cette fonction peut écrire dans le tableau. Ce nombre doit inclure la valeur null
// terminateur, c'est-à-dire si maxBytesToWrite=4, seul le terminateur nul sera écrit et rien d'autre.
// maxBytesToWrite<4 n'écrit aucun octet sur la sortie, pas même le terminateur nul.
// Renvoie le nombre d'octets écrits, À L'EXCLUSION du terminateur nul.

fonction chaîneToUTF32(str, outPtr, maxBytesToWrite) {
  assert(outPtr % 4 == 0, 'Le pointeur passé à stringToUTF32 doit être aligné sur quatre octets !');
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF32(str, outPtr, maxBytesToWrite) manque le troisième paramètre qui spécifie la longueur du tampon de sortie !');
  // Compatibilité descendante : si le nombre maximal d'octets n'est pas spécifié, supposer que l'écriture illimitée non sécurisée est autorisée.
  si (maxBytesToWrite === indéfini) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  si (maxBytesToWrite < 4) renvoie 0 ;
  var startPtr = outPtr;
  var endPtr = startPtr + maxBytesToWrite - 4 ;
  pour (var i = 0; i < str.length; ++i) {
    // Gotcha : charCodeAt renvoie un mot de 16 bits qui est une unité de code encodée en UTF-16, et non un point de code Unicode du caractère ! Nous devons décoder la chaîne en UTF-32 dans le tas.
    // Voir http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i); // éventuellement un substitut principal
    si (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++i);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[((outPtr)>>2)] = codeUnit;
    sortiePtr += 4;
    si (outPtr + 4 > endPtr) pause ;
  }
  // Termine par null le pointeur vers le TAS.
  HEAP32[((outPtr)>>2)] = 0;
  retourner outPtr - startPtr;
}

// Renvoie le nombre d'octets que la chaîne Javascript donnée prend si elle est encodée sous forme de tableau d'octets UTF16, À L'EXCLUSION de l'octet de terminaison nul.

fonction lengthBytesUTF32(str) {
  var longueur = 0;
  pour (var i = 0; i < str.length; ++i) {
    // Gotcha : charCodeAt renvoie un mot de 16 bits qui est une unité de code encodée en UTF-16, et non un point de code Unicode du caractère ! Nous devons décoder la chaîne en UTF-32 dans le tas.
    // Voir http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i);
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) ++i; // éventuellement un substitut principal, donc ignorez le substitut de queue.
    longueur += 4;
  }

  retourner len;
}

// Allouez de l'espace de tas pour une chaîne JS et écrivez-la là.
// Il est de la responsabilité de l'appelant de libérer() cette mémoire.
fonction allocateUTF8(str) {
  var taille = longueurBytesUTF8(str) + 1;
  var ret = _malloc(taille);
  si (ret) stringToUTF8Array(str, HEAP8, ret, taille);
  retour ret;
}

// Allouez de l'espace de pile pour une chaîne JS et écrivez-la là.
fonction allocateUTF8OnStack(str) {
  var taille = longueurBytesUTF8(str) + 1;
  var ret = stackAlloc(taille);
  stringToUTF8Array(str, HEAP8, ret, taille);
  retour ret;
}

// Obsolète : cette fonction ne doit pas être appelée car elle n'est pas sûre et ne fournit pas
// une limite de longueur maximale du nombre d'octets qu'il est autorisé d'écrire. Préférez appeler le
// fonction stringToUTF8Array() à la place, qui prend une longueur maximale qui peut être utilisée
// pour être protégé contre les écritures hors limites.
/** @obsolète
    @param {booléen=} dontAddNull */
fonction writeStringToMemory(chaîne, tampon, dontAddNull) {
  warnOnce('writeStringToMemory est obsolète et ne doit pas être appelé ! Utilisez plutôt stringToUTF8() !');

  var /** @type {nombre} */ lastChar, /** @type {nombre} */ fin;
  si (dontAddNull) {
    // stringToUTF8Array ajoute toujours null. Si nous ne voulons pas faire cela, rappelez-vous le
    // caractère qui existait à l'emplacement où le null sera placé, et restaurer
    // qu'après l'écriture (ci-dessous).
    fin = tampon + longueurBytesUTF8(chaîne);
    lastChar = HEAP8[fin];
  }
  stringToUTF8(chaîne, tampon, Infinity);
  if (dontAddNull) HEAP8[end] = lastChar; // Restaure la valeur sous le caractère nul.
}

fonction writeArrayToMemory(tableau, tampon) {
  assert(array.length >= 0, 'le tableau writeArrayToMemory doit avoir une longueur (doit être un tableau ou un tableau typé)')
  HEAP8.set(tableau, tampon);
}

/** @param {booléen=} dontAddNull */
fonction writeAsciiToMemory(str, tampon, dontAddNull) {
  pour (var i = 0; i < str.length; ++i) {
    assert(str.charCodeAt(i) === (str.charCodeAt(i) & 0xff));
    HEAP8[((buffer++)>>0)] = str.charCodeAt(i);
  }
  // Termine par null le pointeur vers le TAS.
  si (!dontAddNull) HEAP8[((buffer)>>0)] = 0;
}

// fin de l'inclusion : runtime_strings_extra.js
// Gestion de la mémoire

var TAS,
/** @type {!ArrayBuffer} */
  tampon,
/** @type {!Int8Array} */
  TAS8,
/** @type {!Uint8Array} */
  HEAPU8,
/** @type {!Int16Array} */
  TAS16,
/** @type {!Uint16Array} */
  HEAPU16,
/** @type {!Int32Array} */
  TAS32,
/** @type {!Uint32Array} */
  HEAPU32,
/** @type {!Float32Array} */
  TAS F32,
/** @type {!Float64Array} */
  TASP64;

fonction updateGlobalBufferAndViews(buf) {
  tampon = tampon;
  Module['HEAP8'] = HEAP8 = nouveau Int8Array(buf);
  Module['HEAP16'] = HEAP16 = nouveau Int16Array(buf);
  Module['HEAP32'] = HEAP32 = nouveau Int32Array(buf);
  Module['HEAPU8'] = HEAPU8 = new Uint8Array(buf);
  Module['HEAPU16'] = HEAPU16 = nouveau Uint16Array(buf);
  Module['HEAPU32'] = HEAPU32 = new Uint32Array(buf);
  Module['HEAPF32'] = HEAPF32 = nouveau Float32Array(buf);
  Module['HEAPF64'] = HEAPF64 = nouveau Float64Array(buf);
}

var TOTAL_STACK = 5242880;
si (Module['TOTAL_STACK']) assert(TOTAL_STACK === Module['TOTAL_STACK'], 'la taille de la pile ne peut plus être déterminée au moment de l'exécution')

var INITIAL_MEMORY = Module['INITIAL_MEMORY'] || 134217728;legacyModuleProp('INITIAL_MEMORY', 'INITIAL_MEMORY');

assert(INITIAL_MEMORY >= TOTAL_STACK, 'INITIAL_MEMORY devrait être plus grand que TOTAL_STACK, était ' + INITIAL_MEMORY + '! (TOTAL_STACK=' + TOTAL_STACK + ')');

// vérifier la prise en charge complète du moteur (utilisez la chaîne « sous-tableau » pour éviter toute confusion avec le compilateur de fermeture)
assert(typeof Int32Array != 'undefined' && typeof Float64Array !== 'undefined' && Int32Array.prototype.subarray != undefined && Int32Array.prototype.set != undefined,
       « Le moteur JS ne fournit pas de prise en charge complète des tableaux typés »);

// Si la mémoire est définie dans wasm, l'utilisateur ne peut pas la fournir.
assert(!Module['wasmMemory'], 'Utilisation de `wasmMemory` détectée. Utilisez -s IMPORTED_MEMORY pour définir wasmMemory en externe');
assert(INITIAL_MEMORY == 134217728, 'Paramètre INITIAL_MEMORY d'exécution détecté. Utilisez -s IMPORTED_MEMORY pour définir wasmMemory de manière dynamique');

// inclure : runtime_init_table.js
// En mode normal non RELOCATABLE, la table est exportée
// depuis le module wasm et cela sera attribué une fois
// les exportations sont disponibles.
var wasmTable;

// fin de l'inclusion : runtime_init_table.js
// inclure : runtime_stack_check.js


// Initialise le cookie de la pile. Appelé au démarrage de main et au démarrage de chaque thread en mode pthreads.
fonction writeStackCookie() {
  var max = _emscripten_stack_get_end();
  affirmer((max & 3) == 0);
  // La pile s'agrandit vers le bas en direction de _emscripten_stack_get_end.
  // Nous écrivons des cookies dans les deux derniers mots de la pile et détectons s'ils sont
  // jamais écrasé.
  HEAP32[((max)>>2)] = 0x2135467;
  HEAP32[(((max)+(4))>>2)] = 0x89BACDFE;
  // Testez également l'intégrité de l'adresse globale 0.
  HEAP32[0] = 0x63736d65; /* 'emsc' */
}

fonction checkStackCookie() {
  si (ABORT) retour ;
  var max = _emscripten_stack_get_end();
  var cookie1 = HEAPU32[((max)>>2)];
  var cookie2 = HEAPU32[(((max)+(4))>>2)];
  si (cookie1 != 0x2135467 || cookie2 != 0x89BACDFE) {
    abort('Dépassement de capacité de la pile ! Le cookie de la pile a été écrasé, les mots hexadécimaux attendus étaient 0x89BACDFE et 0x2135467, mais 0x a été reçu' + cookie2.toString(16) + ' 0x' + cookie1.toString(16));
  }
  // Testez également l'intégrité de l'adresse globale 0.
  if (HEAP32[0] !== 0x63736d65 /* 'emsc' */) abort('Erreur d'exécution : l'application a corrompu sa zone de mémoire de tas (adresse zéro) !');
}

// fin de l'inclusion : runtime_stack_check.js
// inclure : runtime_assertions.js


// Vérification de l'endianité
(fonction() {
  var h16 = nouveau Int16Array(1);
  var h8 = nouveau Int8Array(h16.buffer);
  h16[0] = 0x6373;
  si (h8[0] !== 0x73 || h8[1] !== 0x63) renvoie 'Erreur d'exécution : le système devait être de type little-endian ! (Exécutez avec -s SUPPORT_BIG_ENDIAN=1 pour contourner)' ;
})();

// fin de l'inclusion : runtime_assertions.js
var __ATPRERUN__ = []; // fonctions appelées avant l'initialisation du runtime
var __ATINIT__ = []; // fonctions appelées au démarrage
var __ATEXIT__ = []; // fonctions appelées pendant l'arrêt
var __ATPOSTRUN__ = []; // fonctions appelées après l'appel de main()

var runtimeInitialized = faux ;

fonction keepRuntimeAlive() {
  renvoie noExitRuntime ;
}

fonction preRun() {

  si (Module['preRun']) {
    si (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    pendant que (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }

  appelRuntimeCallbacks(__ATPRERUN__);
}

fonction initRuntime() {
  checkStackCookie();
  assert(!runtimeInitialized);
  runtimeInitialized = vrai;

  
if (!Module["noFSInit"] && !FS.init.initialized)
  FS.init();
FS.ignorePermissions = faux;

TTY.init();
  appelRuntimeCallbacks(__ATINIT__);
}

fonction postRun() {
  checkStackCookie();

  si (Module['postRun']) {
    si (typeof Module['postRun'] == 'fonction') Module['postRun'] = [Module['postRun']];
    pendant que (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }

  appelRuntimeCallbacks(__ATPOSTRUN__);
}

fonction addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}

fonction addOnInit(cb) {
  __ATINIT__.unshift(cb);
}

fonction addOnExit(cb) {
}

fonction addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}

// inclure : runtime_math.js


// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/fround

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/trunc

assert(Math.imul, 'Ce navigateur ne prend pas en charge Math.imul(), compilez avec LEGACY_VM_SUPPORT ou POLYFILL_OLD_MATH_FUNCTIONS pour ajouter un polyfill');
assert(Math.fround, 'Ce navigateur ne prend pas en charge Math.fround(), compilez avec LEGACY_VM_SUPPORT ou POLYFILL_OLD_MATH_FUNCTIONS pour ajouter un polyfill');
assert(Math.clz32, 'Ce navigateur ne prend pas en charge Math.clz32(), créez avec LEGACY_VM_SUPPORT ou POLYFILL_OLD_MATH_FUNCTIONS pour ajouter un polyfill');
assert(Math.trunc, 'Ce navigateur ne prend pas en charge Math.trunc(), compilez avec LEGACY_VM_SUPPORT ou POLYFILL_OLD_MATH_FUNCTIONS pour ajouter un polyfill');

// fin de l'inclusion : runtime_math.js
// Un compteur de dépendances pour l'appel de run(). Si nous devons
// effectuer un travail asynchrone avant l'exécution, incrémenter ceci et
// le décrémenter. L'incrémentation doit se produire dans un endroit comme
// Module.preRun (utilisé par emcc pour ajouter le préchargement de fichiers).
// Notez que vous pouvez ajouter des dépendances dans preRun, même si
// cela se produit juste avant l'exécution - l'exécution sera reportée jusqu'à
// les dépendances sont satisfaites.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // remplacé pour effectuer des actions différentes lorsque toutes les dépendances d'exécution sont remplies
var runDependencyTracking = {};

fonction getUniqueRunDependency(id) {
  var orig = id;
  tandis que (1) {
    si (!runDependencyTracking[id]) renvoie l'id ;
    id = orig + Math.aléatoire();
  }
}

fonction addRunDependency(id) {
  exécuterDependencies++;

  si (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }

  si (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    si (runDependencyWatcher === null && typeof setInterval != 'undefined') {
      // Vérifiez les dépendances manquantes toutes les quelques secondes
      runDependencyWatcher = setInterval(fonction() {
        si (ABORT) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
          retour;
        }
        var montré = faux;
        pour (var dep dans runDependencyTracking) {
          si (!montré) {
            montré = vrai;
            err('toujours en attente d'exécution des dépendances :');
          }
          err('dépendance : ' + dep);
        }
        si (montré) {
          err('(fin de la liste)');
        }
      }, 10000);
    }
  } autre {
    err('avertissement : exécuter la dépendance ajoutée sans ID');
  }
}

fonction removeRunDependency(id) {
  exécuterDependencies--;

  si (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }

  si (id) {
    assert(runDependencyTracking[id]);
    supprimer runDependencyTracking[id];
  } autre {
    err('avertissement : exécution de la dépendance supprimée sans ID');
  }
  si (runDependencies == 0) {
    si (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    si (dépendances remplies) {
      var callback = dependenciesFulfilled;
      dépendancesFulfilled = null;
      callback(); // peut ajouter d'autres dépendancesRemplies
    }
  }
}

Module["preloadedImages"] = {}; // mappe l'URL aux données de l'image
Module["preloadedAudios"] = {}; // mappe l'URL aux données audio

/** @param {string|number=} quoi */
fonction abort(quoi) {
  {
    si (Module['onAbort']) {
      Module['onAbort'](quoi);
    }
  }

  quoi = 'Avorté(' + quoi + ')';
  // TODO(sbc) : Devrions-nous supprimer l'impression et la laisser à qui que ce soit
  // attrape l'exception ?
  euh(quoi);

  ABORT = vrai;
  ÉTAT DE SORTIE = 1;

  // Utilisez une erreur d'exécution wasm, car une erreur JS peut être considérée comme une erreur étrangère
  // exception, ce qui signifie que nous exécuterions des destructeurs dessus. Nous avons besoin de l'erreur pour
  // arrêtez simplement le programme.

  // Supprimer ici l'avertissement du compilateur de fermeture. Externe intégré du compilateur de fermeture
  // la définition de WebAssembly.RuntimeError affirme qu'il ne prend aucun argument même
  // même si c'est possible.
  // TODO(https://github.com/google/closure-compiler/pull/3913) : Supprimer si/quand la fermeture en amont est corrigée.

  /** @suppress {checkTypes} */
  var e = new WebAssembly.RuntimeError(quoi);

  // Génère l'erreur que MODULARIZE soit défini ou non, car abort est utilisé
  // dans les chemins de code en dehors de l'instanciation où une exception est attendue
  // à lancer lorsque abort est appelé.
  jeter e;
}

// {{MEM_INITIALIZER}}

// inclure : memoryprofiler.js


// fin de l'inclusion : memoryprofiler.js
// inclure : URIUtils.js


// Préfixe des URI de données émis par SINGLE_FILE et options associées.
var dataURIPrefix = 'données:application/octet-stream;base64,';

// Indique si le nom de fichier est un URI de données base64.
fonction isDataURI(nom de fichier) {
  // Préfixe des URI de données émis par SINGLE_FILE et options associées.
  renvoie le nom de fichier.startsWith(dataURIPrefix);
}

// Indique si le nom de fichier est livré via le protocole de fichier (par opposition à http/https)
fonction isFileURI(nom de fichier) {
  renvoie !filename.startsWith('http://') && !filename.startsWith('https://');
}

// fin de l'inclusion : URIUtils.js
/** @param {booléen=} fixedasm */
fonction createExportWrapper(nom, fixedasm) {
  fonction de retour() {
    var displayName = nom;
    var asm = fixedasm;
    si (!fixedasm) {
      asm = Module['asm'];
    }
    assert(runtimeInitialized, 'fonction native `' + displayName + '` appelée avant l'initialisation de l'exécution');
    si (!asm[nom]) {
      assert(asm[name], 'fonction native exportée `' + displayName + '` non trouvée');
    }
    retourner asm[nom].apply(null, arguments);
  };
}

var wasmBinaryFile;
  wasmBinaryFile = 'edge-impulse-standalone.wasm';
  si (!isDataURI(wasmBinaryFile)) {
    wasmBinaryFile = locateFile(wasmBinaryFile);
  }

fonction getBinary(fichier) {
  essayer {
    si (fichier == wasmBinaryFile && wasmBinary) {
      renvoyer un nouveau Uint8Array(wasmBinary);
    }
    si (lireBinaire) {
      retourner readBinary(fichier);
    } autre {
      throw "la récupération asynchrone et synchrone du wasm a échoué" ;
    }
  }
  attraper (err) {
    abandonner(err);
  }
}

fonction getBinaryPromise() {
  // Si nous n'avons pas encore le binaire, essayez de le charger de manière asynchrone.
  // Fetch a quelques restrictions supplémentaires sur XHR, comme le fait qu'il ne peut pas être utilisé sur une URL file://.
  // Voir https://github.com/github/fetch/pull/92#issuecomment-140665932
  // Les applications Cordova ou Electron sont généralement chargées à partir d'une URL file://.
  // Utilisez donc fetch s'il est disponible et que l'URL n'est pas un fichier, sinon revenez à XHR.
  si (!wasmBinary && (ENVIRONNEMENT_EST_WEB || ENVIRONNEMENT_EST_TRAVAILLEUR)) {
    si (typeof fetch == 'fonction'
      && !isFileURI(wasmBinaryFile)
    ) {
      renvoie fetch(wasmBinaryFile, { informations d'identification : 'même origine' }).then(function(response) {
        si (!response['ok']) {
          throw "échec du chargement du fichier binaire wasm à '" + wasmBinaryFile + "'";
        }
        renvoyer la réponse['arrayBuffer']();
      }).catch(fonction () {
          retourner getBinary(wasmBinaryFile);
      });
    }
    autre {
      si (lectureAsync) {
        // fetch n'est pas disponible ou l'url est un fichier => essayer XHR (readAsync utilise XHR en interne)
        renvoyer une nouvelle promesse (fonction (résoudre, rejeter) {
          readAsync(wasmBinaryFile, function(response) { resolve(new Uint8Array(/** @type{!ArrayBuffer} */(response))) }, reject)
        });
      }
    }
  }

  // Sinon, getBinary devrait pouvoir l'obtenir de manière synchrone
  renvoie Promise.resolve().then(function() { renvoie getBinary(wasmBinaryFile); });
}

// Créez l'instance wasm.
// Reçoit les importations wasm, renvoie les exportations.
fonction createWasm() {
  // préparer les importations
  var info = {
    'env': asmLibraryArg,
    'wasi_snapshot_preview1' : asmLibraryArg,
  };
  // Chargez le module wasm et créez une instance en utilisant le support natif dans le moteur JS.
  // gérer une instance wasm générée, recevoir ses exportations et
  // effectuer d'autres configurations nécessaires
  /** @param {WebAssembly.Module=} module*/
  fonction receiveInstance(instance, module) {
    var exportations = instance.exportations;

    Module['asm'] = exportations;

    wasmMemory = Module['asm']['mémoire'];
    assert(wasmMemory, "mémoire non trouvée dans les exportations wasm");
    // Cette assertion n'est pas valable lorsque emscripten est exécuté dans --post-link
    // modes.
    // TODO(sbc) : Lire INITIAL_MEMORY à partir du fichier wasm en mode post-lien.
    //assert(wasmMemory.buffer.byteLength === 134217728);
    updateGlobalBufferAndViews(wasmMemory.buffer);

    wasmTable = Module['asm']['__indirect_function_table'];
    assert(wasmTable, "table non trouvée dans les exportations wasm");

    addOnInit(Module['asm']['__wasm_call_ctors']);

    removeRunDependency('wasm-instantiate');

  }
  // nous ne pouvons pas encore exécuter (sauf dans un pthread, où nous avons un instanciateur de synchronisation personnalisé)
  addRunDependency('wasm-instantiate');

  // Préférez l'instanciation en streaming si disponible.
  // La compilation asynchrone peut être déroutante lorsqu'une erreur sur la page écrase le module
  // (par exemple, si l'ordre des éléments est incorrect et que celui définissant le module est
  // plus tard), nous sauvegardons donc le module et le vérifions plus tard.
  var trueModule = Module;
  fonction receiveInstantiationResult(résultat) {
    // 'result' est un objet ResultObject qui possède à la fois le module et l'instance.
    // receiveInstance() échangera les exportations (vers Module.asm) afin qu'elles puissent être appelées
    assert(Module === trueModule, 'l'objet Module ne doit pas être remplacé pendant la compilation asynchrone - peut-être que l'ordre des éléments HTML est incorrect ?');
    trueModule = null;
    // TODO : en raison de la régression de fermeture https://github.com/google/closure-compiler/issues/3193, la ligne ci-dessus n'est plus optimisée jusqu'à la ligne suivante.
    // Lorsque la régression est corrigée, peut restaurer le chemin activé par USE_PTHREADS ci-dessus.
    receiveInstance(résultat['instance']);
  }

  fonction instantiateArrayBuffer(récepteur) {
    renvoie getBinaryPromise().then(function(binaire) {
      renvoyer WebAssembly.instantiate(binaire, info);
    }).then(fonction (instance) {
      retourner l'instance;
    }).then(récepteur, fonction(raison) {
      err('échec de la préparation asynchrone de wasm : ' + raison);

      // Avertir sur certains problèmes courants.
      si (isFileURI(wasmBinaryFile)) {
        err('avertissement : le chargement à partir d'un URI de fichier (' + wasmBinaryFile + ') n'est pas pris en charge dans la plupart des navigateurs. Voir https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-run-a-local-webserver-for-testing-why-does-my-program-stall-in-downloading-or-preparing');
      }
      abandonner(raison);
    });
  }

  fonction instantiateAsync() {
    si (!wasmBinary &&
        typeof WebAssembly.instantiateStreaming == 'fonction' &&
        !isDataURI(wasmBinaryFile) &&
        // N'utilisez pas le streaming pour les objets livrés file:// dans une vue Web, récupérez-les de manière synchrone.
        !isFileURI(wasmBinaryFile) &&
        typeof fetch == 'fonction') {
      renvoie fetch(wasmBinaryFile, { informations d'identification : 'même origine' }).then(function(response) {
        // Supprimer l'avertissement de fermeture ici puisque la définition en amont pour
        // instantiateStreaming autorise uniquement Promise<Repsponse> plutôt que
        // une réponse réelle.
        // TODO(https://github.com/google/closure-compiler/pull/3913) : Supprimer si/quand la fermeture en amont est corrigée.
        /** @suppress {checkTypes} */
        var résultat = WebAssembly.instantiateStreaming(réponse, info);

        renvoie le résultat.then(
          recevoirInstanciationResult,
          fonction(raison) {
            // Nous nous attendons à ce que la cause d'échec la plus courante soit un mauvais type MIME pour le binaire,
            // dans ce cas, le retour à l'instanciation d'ArrayBuffer devrait fonctionner.
            err('échec de la compilation du streaming wasm : ' + raison);
            err('retour à l'instanciation d'ArrayBuffer');
            renvoyer instantiateArrayBuffer(receiveInstantiationResult);
          });
      });
    } autre {
      renvoyer instantiateArrayBuffer(receiveInstantiationResult);
    }
  }

  // Les pages shell utilisateur peuvent écrire leur propre rappel Module.instantiateWasm = function(imports, successCallback)
  // pour instancier manuellement le module Wasm lui-même. Cela permet aux pages d'exécuter l'instanciation en parallèle
  // à toutes les autres actions de démarrage asynchrones qu'ils exécutent.
  // Les pthreads et les workers wasm initialisent également l'instance wasm via ce chemin.
  si (Module['instantiateWasm']) {
    essayer {
      var exportations = Module['instantiateWasm'](info, receiveInstance);
      exportations de retour;
    } attraper(e) {
      err('Le rappel du module.instantiateWasm a échoué avec l'erreur : ' + e);
      retourner faux;
    }
  }

  instanciateAsync();
  return {}; // aucune exportation pour le moment ; nous les remplirons plus tard
}

// Globals utilisés par les conversions JS i64 (voir makeSetValue)
var tempDouble;
var tempI64;

// === Corps ===

var ASM_CONSTS = {
  
};
fonction xnnLoadWasmModuleJS(code,décalage,fin_décalage,index_fonction_non_valide){ const tableOriginalSize = wasmTable.length; const binary = new Uint8Array(HEAPU8.slice(code + offset, code + offset_end)); try { var module = new WebAssembly.Module(binary); var instance = new WebAssembly.Instance(module, {env : {memory: wasmMemory}}); for (var symName in instance.exports) { var value = instance.exports[symName]; addFunction(value); } if (tableOriginalSize < wasmTable.length) { return tableOriginalSize; } return invalid_function_index; } catch(error) { console.log(error); return invalid_function_index; } }





  appel de fonctionRuntimeCallbacks(callbacks) {
      tandis que (rappels.length > 0) {
        var callback = rappels.shift();
        si (typeof callback == 'fonction') {
          callback(Module); // Passez le module comme premier argument.
          continuer;
        }
        var func = rappel.func;
        si (typeof func == 'numéro') {
          si (callback.arg === indéfini) {
            // Exécutez la fonction wasm ptr avec la signature 'v'. Si aucune fonction
            // avec une telle signature a été exportée, cet appel n'a pas besoin
            // à émettre (et confondrait Closure)
            getWasmTableEntry(fonction)();
          } autre {
            // Si une fonction avec la signature 'vi' a été exportée, exécutez
            // le rappel avec cette signature.
            getWasmTableEntry(func)(callback.arg);
          }
        } autre {
          func(callback.arg === indéfini ? null : callback.arg);
        }
      }
    }

  fonction avecStackSave(f) {
      var pile = stackSave();
      var ret = f();
      stackRestore(pile);
      retour ret;
    }
  fonction demangle(func) {
      warnOnce('avertissement : compiler avec -s DEMANGLE_SUPPORT=1 pour créer un lien dans libcxxabi demangling');
      fonction de retour ;
    }

  fonction demangleAll(texte) {
      var expression régulière =
        /\b_Z[\w\d_]+/g;
      retourner le texte.replace(regex,
        fonction(x) {
          var y = démêler(x);
          retourner x === y ? x : (y + ' [' + x + ']');
        });
    }

  fonction getWasmTableEntry(funcPtr) {
      // Dans les builds -Os et -Oz, n'implémentez pas de miroir de table wasm côté JS pour les petits
      // taille du code, mais accès direct à wasmTable, ce qui est un peu plus lent car non mis en cache.
      retourner wasmTable.get(funcPtr);
    }

  fonction handleException(e) {
      // Certains types d'exceptions ne sont pas traités comme des erreurs car ils sont utilisés pour
      // flux de contrôle interne.
      // 1. ExitStatus, qui est généré par exit()
      // 2. "unwind", qui est lancé par emscripten_unwind_to_js_event_loop() et d'autres
      // qui souhaitent revenir à la boucle d'événements JS.
      si (e instanceof ExitStatus || e == 'unwind') {
        retourner EXITSTATUS;
      }
      quitter_(1, e);
    }

  fonction jsStackTrace() {
      var erreur = nouvelle erreur();
      si (!erreur.pile) {
        // Cas spéciaux IE10+ : il contient des informations sur la pile d'appels, mais elles ne sont renseignées que si un objet Error est généré,
        // alors essayez cela comme un cas spécial.
        essayer {
          lancer une nouvelle erreur();
        } attraper(e) {
          erreur = e;
        }
        si (!erreur.pile) {
          retourner '(aucune trace de pile disponible)';
        }
      }
      renvoie l'erreur.stack.toString();
    }

  fonction setWasmTableEntry(idx, func) {
      wasmTable.set(idx, fonction);
    }

  fonction stackTrace() {
      var js = jsStackTrace();
      si (Module['extraStackTrace']) js += '\n' + Module['extraStackTrace']();
      retourner demangleAll(js);
    }

  /** @type {fonction(...*):?} */
  fonction __ZN6tflite8resource16ResourceVariable10AssignFromEPK12TfLiteTensor(
  ) {
  err('fonction manquante : _ZN6tflite8resource16ResourceVariable10AssignFromEPK12TfLiteTensor'); abort(-1);
  }

  /** @type {fonction(...*):?} */
  fonction __ZN6tflite8resource19GetResourceVariableEPNSt3__213carte_non_ordonnéeIiNS1_10ptr_uniqueINS0_12Base_de_ressourcesENS1_14suppression_par_défautIS4_EEEENS1_4hashIiEENS1_8égal_àIiEENS1_9allocateurINS1_4paireIKiS7_EEEEEEi(
  ) {
  err('fonction manquante : _ZN6tflite8resource19GetResourceVariableEPNSt3__213unordered_mapIiNS1_10unique_ptrINS0_12ResourceBaseENS1_14default_deleteIS4_EEEENS1_4hashIiEENS1_8equal_toIiEENS1_9allocatorINS1_4pairIKiS7_EEEEEEi'); abort(-1);
  }

  /** @type {fonction(...*):?} */
  fonction __ZN6tflite8resource20GetHashtableResourceEPNSt3__213carte_non_ordonnéeIiNS1_10ptr_uniqueINS0_12Base_de_ressourcesENS1_14suppression_par_défautIS4_EEEENS1_4hashIiEENS1_8égal_àIiEENS1_9allocateurINS1_4paireIKiS7_EEEEEEi(
  ) {
  err('fonction manquante : _ZN6tflite8resource20GetHashtableResourceEPNSt3__213unordered_mapIiNS1_10unique_ptrINS0_12ResourceBaseENS1_14default_deleteIS4_EEEENS1_4hashIiEENS1_8equal_toIiEENS1_9allocatorINS1_4pairIKiS7_EEEEEEi'); abort(-1);
  }

  /** @type {fonction(...*):?} */
  fonction __ZN6tflite8resource20InitializationStatus24MarkInitializationIsDoneEv(
  ) {
  err('fonction manquante : _ZN6tflite8resource20InitializationStatus24MarkInitializationIsDoneEv'); abort(-1);
  }

  /** @type {fonction(...*):?} */
  fonction __ZN6tflite8resource23GetInitializationStatusEPNSt3__213carte_non_ordonnéeIiNS1_10ptr_uniqueINS0_20InitializationStatusENS1_14suppression_par_défautIS4_EEEENS1_4hashIiEENS1_8égal_àIiEENS1_9allocateurINS1_4paireIKiS7_EEEEEEi(
  ) {
  err('fonction manquante : _ZN6tflite8resource23GetInitializationStatusEPNSt3__213unordered_mapIiNS1_10unique_ptrINS0_20InitializationStatusENS1_14default_deleteIS4_EEEENS1_4hashIiEENS1_8equal_toIiEENS1_9allocatorINS1_4pairIKiS7_EEEEEEi'); abort(-1);
  }

  /** @type {fonction(...*):?} */
  fonction __ZN6tflite8resource36CreateResourceVariableIfNotAvailableEPNSt3__213carte_non_ordonnéeIiNS1_10ptr_uniqueINS0_12Base_de_ressourcesENS1_14suppression_par_défautIS4_EEEENS1_4hachageIiEENS1_8égal_àIiEENS1_9allocateurINS1_4paireIKiS7_EEEEEEi(
  ) {
  err('fonction manquante : _ZN6tflite8resource36CreateResourceVariableIfNotAvailableEPNSt3__213unordered_mapIiNS1_10unique_ptrINS0_12ResourceBaseENS1_14default_deleteIS4_EEEENS1_4hashIiEENS1_8equal_toIiEENS1_9allocatorINS1_4pairIKiS7_EEEEEEi'); abort(-1);
  }

  /** @type {fonction(...*):?} */
  fonction __ZN6tflite8resource37CreateHashtableResourceIfNotAvailableEPNSt3__213carte_non_ordonnéeIiNS1_10ptr_uniqueINS0_12Base_de_ressourcesENS1_14suppression_par_défautIS4_EEEENS1_4hachageIiEENS1_8égal_àIiEENS1_9allocateurINS1_4paireIKiS7_EEEEEEi10TfLiteTypeSJ_(
  ) {
  err('fonction manquante : _ZN6tflite8resource37CreateHashtableResourceIfNotAvailableEPNSt3__213unordered_mapIiNS1_10unique_ptrINS0_12ResourceBaseENS1_14default_deleteIS4_EEEENS1_4hashIiEENS1_8equal_toIiEENS1_9allocatorINS1_4pairIKiS7_EEEEEEi10TfLiteTypeSJ_'); abort(-1);
  }

  fonction ___assert_fail(condition, nom de fichier, ligne, fonction) {
      abort('Assertion échouée : ' + UTF8ToString(condition) + ', at: ' + [filename ? UTF8ToString(filename) : 'nom de fichier inconnu', line, func ? UTF8ToString(func) : 'fonction inconnue']);
    }

  fonction ___cxa_allocate_exception(taille) {
      // L'objet lancé est précédé d'un bloc de métadonnées d'exception
      retourner _malloc(taille + 16) + 16;
    }

  /** @constructeur */
  fonction ExceptionInfo(excPtr) {
      ceci.excPtr = excPtr;
      ceci.ptr = excPtr - 16;
  
      ceci.set_type = fonction(type) {
        HEAP32[(((ce.ptr)+(4))>>2)] = type;
      };
  
      ceci.get_type = fonction() {
        retourner HEAP32[(((this.ptr)+(4))>>2)];
      };
  
      this.set_destructor = fonction(destructeur) {
        HEAP32[(((this.ptr)+(8))>>2)] = destructeur;
      };
  
      ceci.get_destructor = fonction() {
        retourner HEAP32[(((this.ptr)+(8))>>2)];
      };
  
      ceci.set_refcount = fonction(refcount) {
        HEAP32[((this.ptr)>>2)] = nombre de références ;
      };
  
      this.set_caught = fonction (attrapé) {
        attrapé = attrapé ? 1 : 0 ;
        HEAP8[(((this.ptr)+(12))>>0)] = attrapé;
      };
  
      ceci.get_caught = fonction () {
        renvoie HEAP8[(((this.ptr)+(12))>>0)] != 0;
      };
  
      this.set_rethrown = fonction (relancée) {
        rejeté = rejeté ? 1 : 0;
        HEAP8[(((this.ptr)+(13))>>0)] = renvoyé ;
      };
  
      ceci.get_rethrown = fonction () {
        renvoie HEAP8[(((this.ptr)+(13))>>0)] != 0;
      };
  
      // Initialiser les champs de structure natifs. Doit être appelé une fois après l'allocation.
      this.init = fonction(type, destructeur) {
        ceci.set_type(type);
        ceci.set_destructor(destructeur);
        ceci.set_refcount(0);
        ceci.set_caught(faux);
        ceci.set_rethrown(faux);
      }
  
      ceci.add_ref = fonction() {
        var valeur = HEAP32[((this.ptr)>>2)];
        HEAP32[((this.ptr)>>2)] = valeur + 1;
      };
  
      // Renvoie vrai si la dernière référence a été libérée.
      ceci.release_ref = fonction() {
        var prev = HEAP32[((this.ptr)>>2)];
        HEAP32[((this.ptr)>>2)] = précédent - 1;
        assert(précédent > 0);
        retour prev === 1;
      };
    }
  
  var exceptionLast = 0;
  
  var uncaughtExceptionCount = 0;
  fonction ___cxa_throw(ptr, type, destructeur) {
      var info = new ExceptionInfo(ptr);
      // Initialiser le contenu ExceptionInfo après son allocation dans __cxa_allocate_exception.
      info.init(type, destructeur);
      exceptionLast = ptr;
      uncaughtExceptionCount++;
      throw ptr + " - La capture d'exceptions est désactivée, cette exception ne peut pas être interceptée. Compilez avec -s NO_DISABLE_EXCEPTION_CATCHING ou -s EXCEPTION_CATCHING_ALLOWED=[..] pour intercepter.";
    }

  fonction __dlopen_js(nom de fichier, indicateur) {
      abort("Pour utiliser dlopen, vous devez utiliser le support de liaison d'Emscripten, voir https://github.com/emscripten-core/emscripten/wiki/Linking");
    }

  fonction __dlsym_js(handle, symbole) {
      abort("Pour utiliser dlopen, vous devez utiliser le support de liaison d'Emscripten, voir https://github.com/emscripten-core/emscripten/wiki/Linking");
    }

  fonction __embind_register_bigint(primitiveType, nom, taille, minRange, maxRange) {}

  fonction getShiftFromSize(taille) {
      
      commutateur (taille) {
          cas 1 : retour 0 ;
          cas 2 : retour 1 ;
          cas 4 : retour 2 ;
          cas 8 : retour 3 ;
          défaut:
              throw new TypeError('Taille de type inconnue : ' + size);
      }
    }
  
  fonction embind_init_charCodes() {
      var codes = nouveau tableau(256);
      pour (var je = 0; je < 256; ++i) {
          codes[i] = String.fromCharCode(i);
      }
      embind_charCodes = codes;
    }
  var embind_charCodes = undefined;
  fonction readLatin1String(ptr) {
      var ret = "";
      var c = ptr;
      tandis que (HEAPU8[c]) {
          ret += embind_charCodes[HEAPU8[c++]];
      }
      retour ret;
    }
  
  var en attente de dépendances = {};
  
  var registeredTypes = {};
  
  var typeDependencies = {};
  
  var char_0 = 48;
  
  var char_9 = 57;
  fonction makeLegalFunctionName(nom) {
      si (indéfini === nom) {
        retourner '_unknown';
      }
      nom = nom.replace(/[^a-zA-Z0-9_]/g, '$');
      var f = nom.charCodeAt(0);
      si (f >= char_0 && f <= char_9) {
        retourner '_' + nom;
      }
      renvoyer le nom;
    }
  fonction createNamedFunction(nom, corps) {
      nom = makeLegalFunctionName(nom);
      /*jshint evil:true*/
      renvoyer une nouvelle fonction(
          "corps",
          "fonction de retour " + nom + "() {\n" +
          " \"utiliser strict\";" +
          "retourne body.apply(this, arguments);\n" +
          "};\n"
      )(corps);
    }
  fonction extendError(baseErrorType, errorName) {
      var errorClass = createNamedFunction(errorName, function(message) {
          ceci.nom = nom_erreur;
          ce.message = message;
  
          var stack = (nouvelle erreur(message)).stack;
          si (pile !== indéfini) {
              ceci.stack = ceci.toString() + '\n' +
                  pile.replace(/^Erreur(:[^\n]*)?\n/, '');
          }
      });
      errorClass.prototype = Objet.create(baseErrorType.prototype);
      errorClass.prototype.constructor = errorClass;
      errorClass.prototype.toString = fonction() {
          si (ce.message === indéfini) {
              renvoie ceci.nom;
          } autre {
              renvoyer ceci.nom + ': ' + ceci.message;
          }
      };
  
      retourner errorClass;
    }
  var BindingError = indéfini;
  fonction throwBindingError(message) {
      lancer une nouvelle BindingError(message);
    }
  
  var InternalError = non défini ;
  fonction throwInternalError(message) {
      lancer une nouvelle InternalError(message);
    }
  fonction lorsque les types dépendants sont résolus (myTypes, dependentTypes, getTypeConverters) {
      mesTypes.forEach(fonction(type) {
          typeDependencies[type] = dependentTypes;
      });
  
      fonction onComplete(typeConverters) {
          var mesConvertisseursDeType = getConvertisseursDeType(ConvertisseursDeType);
          si (myTypeConverters.length !== myTypes.length) {
              throwInternalError('Nombre de convertisseurs de type incompatibles');
          }
          pour (var i = 0; i < mesTypes.length; ++i) {
              registerType(mesTypes[i], mesConvertisseursDeTypes[i]);
          }
      }
  
      var typeConverters = new Array(dependentTypes.length);
      var unregisteredTypes = [];
      var enregistré = 0;
      dependentTypes.forEach((dt, i) => {
        si (registeredTypes.hasOwnProperty(dt)) {
          typeConverters[i] = registeredTypes[dt];
        } autre {
          non enregistréTypes.push(dt);
          si (!waitingDependencies.hasOwnProperty(dt)) {
            en attente de dépendances[dt] = [];
          }
          en attente de dépendances[dt].push(() => {
            typeConverters[i] = registeredTypes[dt];
            ++enregistré;
            si (enregistré === unregisteredTypes.length) {
              onComplete(convertisseurs de type);
            }
          });
        }
      });
      si (0 === unregisteredTypes.length) {
        onComplete(convertisseurs de type);
      }
    }
  /** @param {Object=} options */
  fonction registerType(rawType, registeredInstance, options = {}) {
      si (!('argPackAdvance' dans registeredInstance)) {
          throw new TypeError('registerType registeredInstance requiert argPackAdvance');
      }
  
      var nom = enregistréInstance.nom;
      si (!rawType) {
          throwBindingError('type "' + name + '" doit avoir un pointeur typeid d'entier positif');
      }
      si (registeredTypes.hasOwnProperty(rawType)) {
          si (options.ignoreDuplicateRegistrations) {
              retour;
          } autre {
              throwBindingError("Impossible d'enregistrer le type '" + nom + "' deux fois");
          }
      }
  
      registeredTypes[rawType] = registeredInstance;
      supprimer typeDependencies[rawType];
  
      si (en attente de dépendances.hasOwnProperty(rawType)) {
        var rappels = en attente de dépendances [rawType];
        supprimer waitingDependencies[rawType];
        rappels.forEach((cb) => cb());
      }
    }
  fonction __embind_register_bool(rawType, nom, taille, trueValue, falseValue) {
      var shift = getShiftFromSize(taille);
  
      nom = readLatin1String(nom);
      registerType(type brut, {
          nom: nom,
          'fromWireType': fonction(wt) {
              // ABI emscripten ambigu : parfois, les valeurs de retour sont
              // vrai ou faux, et parfois des entiers (0 ou 1)
              retour !!wt;
          },
          'toWireType': fonction(destructeurs, o) {
              retourner o ? trueValue : falseValue;
          },
          'argPackAdvance': 8,
          'readValueFromPointer': fonction(pointeur) {
              // TODO : si le tas est fixe (comme dans asm.js), cela peut être exécuté en dehors
              var tas;
              si (taille === 1) {
                  tas = HEAP8;
              } sinon si (taille === 2) {
                  tas = HEAP16;
              } sinon si (taille === 4) {
                  tas = HEAP32;
              } autre {
                  throw new TypeError("Taille du type booléen inconnu : " + nom);
              }
              renvoyer ceci['fromWireType'](tas[pointeur >> shift]);
          },
          destructorFunction : null, // Ce type n'a pas besoin de destructeur
      });
    }

  fonction ClassHandle_isAliasOf(autre) {
      si (!(cette instance de ClassHandle)) {
        retourner faux;
      }
      si (!(autre instance de ClassHandle)) {
        retourner faux;
      }
  
      var leftClass = ceci.$$.ptrType.registeredClass;
      var gauche = ceci.$$.ptr;
      var rightClass = autre.$$.ptrType.registeredClass;
      var droite = autre.$$.ptr;
  
      tandis que (classegauche.classedebase) {
        gauche = leftClass.upcast(gauche);
        classegauche = classegauche.baseClass;
      }
  
      tandis que (rightClass.baseClass) {
        droite = rightClass.upcast(droite);
        droiteClass = droiteClass.baseClass;
      }
  
      retourner leftClass === rightClass && gauche === droite ;
    }
  
  fonction shallowCopyInternalPointer(o) {
      retour {
          compter : o.compter,
          supprimerProgrammé : o.supprimerProgrammé,
          préserverPointeurSurSuppression : o.préserverPointeurSurSuppression,
          ptr: o.ptr,
          ptrType : o.ptrType,
          smartPtr : ou.smartPtr,
          smartPtrType : o.smartPtrType,
      };
    }
  
  fonction throwInstanceAlreadyDeleted(obj) {
      fonction getInstanceTypeName(handle) {
        retourner la poignée.$$.ptrType.registeredClass.name;
      }
      throwBindingError(getInstanceTypeName(obj) + ' instance déjà supprimée');
    }
  
  var finalizationRegistry = false;
  
  fonction detachFinalizer(handle) {}
  
  fonction runDestructor($$) {
      si ($$.smartPtr) {
          $$.smartPtrType.rawDestructor($$.smartPtr);
      } autre {
          $$.ptrType.registeredClass.rawDestructor($$.ptr);
      }
    }
  fonction releaseClassHandle($$) {
      $$.count.value -= 1;
      var toDelete = 0 === $$.count.value;
      si (à supprimer) {
        exécuterDestructor($$);
      }
    }
  
  fonction downcastPointer(ptr, ptrClass, desiredClass) {
      si (ptrClass === classe souhaitée) {
        retourner ptr;
      }
      si (indéfini === desiredClass.baseClass) {
        retourner null; // aucune conversion
      }
  
      var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass);
      si (rv === nul) {
          retourner null;
      }
      renvoie la classe désirée.downcast(rv);
    }
  
  var registeredPointers = {};
  
  fonction getInheritedInstanceCount() {
      renvoyer Object.keys(registeredInstances).length;
    }
  
  fonction getLiveInheritedInstances() {
      var rv = [];
      pour (var k dans les instances enregistrées) {
          si (registeredInstances.hasOwnProperty(k)) {
              rv.push(instances enregistrées[k]);
          }
      }
      retourner le camping-car;
    }
  
  var deletionQueue = [];
  fonction flushPendingDeletes() {
      tandis que (deletionQueue.length) {
        var obj = deletionQueue.pop();
        obj.$$.deleteScheduled = faux;
        obj['supprimer']();
      }
    }
  
  var delayFunction = indéfini;
  fonction setDelayFunction(fn) {
      delayFunction = fn;
      si (deletionQueue.length && delayFunction) {
        delayFunction(flushPendingDeletes);
      }
    }
  fonction init_embind() {
      Module['getInheritedInstanceCount'] = getInheritedInstanceCount;
      Module['getLiveInheritedInstances'] = getLiveInheritedInstances;
      Module['flushPendingDeletes'] = flushPendingDeletes;
      Module['setDelayFunction'] = setDelayFunction;
    }
  var registeredInstances = {};
  
  fonction getBasestPointer(classe_, ptr) {
      si (ptr === indéfini) {
          throwBindingError('ptr ne doit pas être indéfini');
      }
      tandis que (classe_.baseClass) {
          ptr = classe_.upcast(ptr);
          classe_ = classe_.baseClass;
      }
      retourner ptr;
    }
  fonction getInheritedInstance(classe_, ptr) {
      ptr = getBasestPointer(classe_, ptr);
      renvoyer les instances enregistrées[ptr] ;
    }
  
  fonction makeClassHandle(prototype, enregistrement) {
      si (!record.ptrType || !record.ptr) {
        throwInternalError('makeClassHandle nécessite ptr et ptrType');
      }
      var hasSmartPtrType = !!record.smartPtrType;
      var hasSmartPtr = !!record.smartPtr;
      si (hasSmartPtrType !== hasSmartPtr) {
        throwInternalError('smartPtrType et smartPtr doivent être spécifiés');
      }
      record.count = { valeur : 1 };
      renvoyer attachFinalizer(Object.create(prototype, {
        $$: {
            valeur : enregistrement,
        },
      }));
    }
  fonction RegisteredPointer_fromWireType(ptr) {
      // ptr est un pointeur brut (ou un pointeur intelligent brut)
  
      // rawPointer est un pointeur brut peut-être nul
      var rawPointer = this.getPointee(ptr);
      si (!rawPointer) {
        ce.destructeur(ptr);
        retourner null;
      }
  
      var registeredInstance = getInheritedInstance(this.registeredClass, rawPointer);
      si (undefined !== instance enregistrée) {
        // L'objet JS a été neutralisé, il est temps de le repeupler
        si (0 === registeredInstance.$$.count.value) {
          registeredInstance.$$.ptr = rawPointer;
          registeredInstance.$$.smartPtr = ptr;
          renvoyer registeredInstance['clone']();
        } autre {
          // sinon, incrémentez simplement le nombre de références sur l'objet existant
          // il a déjà une référence au pointeur intelligent
          var rv = registeredInstance['clone']();
          ce.destructeur(ptr);
          retourner le camping-car;
        }
      }
  
      fonction makeDefaultHandle() {
        si (ceci.isSmartPointer) {
          renvoie makeClassHandle(this.registeredClass.instancePrototype, {
            ptrType : this.pointeeType,
            ptr : rawPointer,
            smartPtrType : ceci,
            smartPtr : ptr,
          });
        } autre {
          renvoie makeClassHandle(this.registeredClass.instancePrototype, {
            ptrType : ceci,
            ptr: ptr,
          });
        }
      }
  
      var actualType = this.registeredClass.getActualType(rawPointer);
      var enregistréPointerRecord = enregistréPointers[actualType];
      si (!registeredPointerRecord) {
        retourner makeDefaultHandle.call(this);
      }
  
      var àType;
      si (ceci.isConst) {
        toType = registeredPointerRecord.constPointerType;
      } autre {
        toType = registeredPointerRecord.pointerType;
      }
      var dp = downcastPointer(
          pointeur brut,
          cette.classe.enregistrée,
          toType.classeenregistrée);
      si (dp === nul) {
          retourner makeDefaultHandle.call(this);
      }
      si (ceci.isSmartPointer) {
        renvoie makeClassHandle(toType.registeredClass.instancePrototype, {
          ptrType : toType,
          ptr: dp,
          smartPtrType : ceci,
          smartPtr : ptr,
        });
      } autre {
        renvoie makeClassHandle(toType.registeredClass.instancePrototype, {
          ptrType : toType,
          ptr: dp,
        });
      }
    }
  fonction attachFinalizer(poignée) {
      si ('undefined' === typeof FinalizationRegistry) {
          attachFinalizer = (poignée) => poignée;
          poignée de retour;
      }
      // Si l'environnement en cours d'exécution possède un FinalizationRegistry (voir
      // https://github.com/tc39/proposal-weakrefs), puis attachez les finaliseurs
      // pour les handles de classe. Nous vérifions la présence de FinalizationRegistry
      // au moment de l'exécution, pas au moment de la construction.
      finalizationRegistry = nouveau FinalizationRegistry((info) => {
          console.warn(info.leakWarning.stack.replace(/^Erreur : /, ''));
          releaseClassHandle(info.$$);
      });
      attachFinalizer = (poignée) => {
        var $$ = poignée.$$;
        var hasSmartPtr = !!$$.smartPtr;
        si (hasSmartPtr) {
          // Nous ne devrions pas appeler le destructeur sur des pointeurs bruts au cas où un autre code s'attend à ce que le pointé vive
          var info = { $$: $$ };
          // Créez à l'avance un avertissement en tant qu'instance d'erreur afin que nous puissions le stocker
          // la stacktrace actuelle et pointe vers elle lorsque / si une fuite est détectée.
          // Ceci est plus utile que la stacktrace vide de `FinalizationRegistry`
          // rappel.
          var cls = $$.ptrType.registeredClass;
          info.leakWarning = new Error("Embind a trouvé une instance C++ divulguée " + cls.name + " <0x" + $$.ptr.toString(16) + ">.\n" +
          « Nous le libérerons automatiquement dans ce cas, mais cette fonctionnalité n'est pas fiable dans différents environnements.\n » +
          « Assurez-vous d'appeler .delete() manuellement une fois que vous avez terminé avec l'instance à la place.\n » +
          "Initialement alloué"); // `.stack` ajoutera "à ..." après cette phrase
          si ('captureStackTrace' dans Erreur) {
              Erreur.captureStackTrace(info.leakWarning, RegisteredPointer_fromWireType);
          }
          finalizationRegistry.register(poignée, info, poignée);
        }
        poignée de retour;
      };
      detachFinalizer = (handle) => finalizationRegistry.unregister(handle);
      retourner attachFinalizer(handle);
    }
  fonction ClassHandle_clone() {
      si (!this.$$.ptr) {
        throwInstanceAlreadyDeleted(ceci);
      }
  
      si (ceci.$$.preservePointerOnDelete) {
        ceci.$$.count.value += 1;
        retourne ceci;
      } autre {
        var clone = attachFinalizer(Objet.create(Objet.getPrototypeOf(this), {
          $$: {
            valeur : shallowCopyInternalPointer(this.$$),
          }
        }));
  
        clone.$$.count.value += 1;
        clone.$$.deleteScheduled = faux;
        retourner le clone;
      }
    }
  
  fonction ClassHandle_delete() {
      si (!this.$$.ptr) {
        throwInstanceAlreadyDeleted(ceci);
      }
  
      si (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
        throwBindingError('Objet déjà programmé pour suppression');
      }
  
      detachFinalizer(ceci);
      releaseClassHandle(ceci.$$);
  
      si (!this.$$.preservePointerOnDelete) {
        ceci.$$.smartPtr = indéfini;
        ceci.$$.ptr = indéfini;
      }
    }
  
  fonction ClassHandle_isDeleted() {
      renvoie !this.$$.ptr;
    }
  
  fonction ClassHandle_deleteLater() {
      si (!this.$$.ptr) {
        throwInstanceAlreadyDeleted(ceci);
      }
      si (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
        throwBindingError('Objet déjà programmé pour suppression');
      }
      suppressionQueue.push(ceci);
      si (deletionQueue.length === 1 && delayFunction) {
        delayFunction(flushPendingDeletes);
      }
      ceci.$$.deleteScheduled = vrai;
      retourne ceci;
    }
  fonction init_ClassHandle() {
      ClassHandle.prototype['isAliasOf'] = ClassHandle_isAliasOf;
      ClassHandle.prototype['clone'] = ClassHandle_clone;
      ClassHandle.prototype['delete'] = ClassHandle_delete;
      ClassHandle.prototype['isDeleted'] = ClassHandle_isDeleted;
      ClassHandle.prototype['deleteLater'] = ClassHandle_deleteLater;
    }
  fonction ClassHandle() {
    }
  
  fonction ensureOverloadTable(proto, methodName, humanName) {
      si (undefined === proto[methodName].overloadTable) {
        var prevFunc = proto[nomméthode];
        // Injectez une fonction de résolution de surcharge qui achemine vers la surcharge appropriée en fonction du nombre d'arguments.
        proto[methodName] = function() {
          // TODO Cette vérification peut être supprimée dans les optimisations « non sécurisées » de niveau -O3.
          si (!proto[methodName].overloadTable.hasOwnProperty(arguments.length)) {
              throwBindingError("Fonction '" + humanName + "' appelée avec un nombre d'arguments non valide (" + arguments.length + ") - attend l'un des (" + proto[methodName].overloadTable + ")!");
          }
          renvoyer proto[methodName].overloadTable[arguments.length].apply(this, arguments);
        };
        // Déplacer la fonction précédente dans la table de surcharge.
        proto[methodName].overloadTable = [];
        proto[methodName].overloadTable[prevFunc.argCount] = prevFunc;
      }
    }
  /** @param {nombre=} numArguments */
  fonction exposePublicSymbol(nom, valeur, numArguments) {
      si (Module.hasOwnProperty(nom)) {
        si (undefined === numArguments || (undefined !== Module[nom].overloadTable && undefined !== Module[nom].overloadTable[numArguments])) {
          throwBindingError("Impossible d'enregistrer le nom public '" + nom + "' deux fois");
        }
  
        // Nous exposons une fonction portant le même nom qu'une fonction existante. Créez une table de surcharge et un sélecteur de fonction
        // qui fait la liaison entre les deux.
        ensureOverloadTable(Module, nom, nom);
        si (Module.hasOwnProperty(numArguments)) {
            throwBindingError("Impossible d'enregistrer plusieurs surcharges d'une fonction avec le même nombre d'arguments (" + numArguments + ")!");
        }
        // Ajoutez la nouvelle fonction dans la table de surcharge.
        Module[nom].overloadTable[numArguments] = valeur ;
      }
      autre {
        Module[nom] = valeur;
        si (indéfini !== numArguments) {
          Module[nom].numArguments = numArguments;
        }
      }
    }
  
  /** @constructeur */
  fonction RegisteredClass(nom,
                               constructeur,
                               instancePrototype,
                               Destructeur brut,
                               classe de base,
                               obtenir le type réel,
                               en colère,
                               abattu) {
      ceci.nom = nom;
      this.constructor = constructeur;
      ceci.instancePrototype = instancePrototype;
      ceci.rawDestructor = rawDestructor;
      cette.baseClass = baseClass;
      ceci.getActualType = getActualType;
      ceci.upcast = upcast;
      ceci.abattu = abattu;
      ceci.pureVirtualFunctions = [];
    }
  
  fonction upcastPointer(ptr, ptrClass, desiredClass) {
      tandis que (ptrClass !== classe souhaitée) {
        si (!ptrClass.upcast) {
          throwBindingError("Null attendu ou instance de " + desiredClass.name + ", une instance de " + ptrClass.name a été obtenue);
        }
        ptr = ptrClass.upcast(ptr);
        ptrClass = ptrClass.baseClass;
      }
      retourner ptr;
    }
  fonction constNoSmartPtrRawPointerToWireType(destructeurs, handle) {
      si (poignée === null) {
        si (ceci.estRéférence) {
          throwBindingError('null n'est pas une valeur valide ' + this.name);
        }
        retourner 0;
      }
  
      si (!handle.$$) {
        throwBindingError('Impossible de transmettre "' + _embind_repr(handle) + '" en tant que ' + this.name);
      }
      si (!handle.$$.ptr) {
        throwBindingError('Impossible de transmettre l'objet supprimé en tant que pointeur de type ' + this.name);
      }
      var handleClass = handle.$$.ptrType.registeredClass;
      var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
      retourner ptr;
    }
  
  fonction genericPointerToWireType(destructeurs, handle) {
      var ptr;
      si (poignée === null) {
        si (ceci.estRéférence) {
          throwBindingError('null n'est pas une valeur valide ' + this.name);
        }
  
        si (ceci.isSmartPointer) {
          ptr = this.rawConstructor();
          si (destructeurs !== null) {
            destructeurs.push(this.rawDestructor, ptr);
          }
          retourner ptr;
        } autre {
          retourner 0;
        }
      }
  
      si (!handle.$$) {
        throwBindingError('Impossible de transmettre "' + _embind_repr(handle) + '" en tant que ' + this.name);
      }
      si (!handle.$$.ptr) {
        throwBindingError('Impossible de transmettre l'objet supprimé en tant que pointeur de type ' + this.name);
      }
      si (!this.isConst && handle.$$.ptrType.isConst) {
        throwBindingError('Impossible de convertir l'argument de type ' + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + ' en type de paramètre ' + this.name);
      }
      var handleClass = handle.$$.ptrType.registeredClass;
      ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
  
      si (ceci.isSmartPointer) {
        // TODO : ce n'est pas strictement vrai
        // Nous pourrions prendre en charge les conversions BY_EMVAL des pointeurs bruts aux pointeurs intelligents
        // parce que le pointeur intelligent peut contenir une référence au handle
        si (indéfini === handle.$$.smartPtr) {
          throwBindingError('Le passage d'un pointeur brut à un pointeur intelligent est illégal');
        }
  
        commutateur (this.sharingPolicy) {
          cas 0 : // AUCUN
            // pas de conversion ascendante
            si (handle.$$.smartPtrType === ceci) {
              ptr = poignée.$$.smartPtr;
            } autre {
              throwBindingError('Impossible de convertir l'argument de type ' + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + ' en type de paramètre ' + this.name);
            }
            casser;
  
          cas 1 : // INTRUSIF
            ptr = poignée.$$.smartPtr;
            casser;
  
          cas 2 : // BY_EMVAL
            si (handle.$$.smartPtrType === ceci) {
              ptr = poignée.$$.smartPtr;
            } autre {
              var clonedHandle = handle['clone']();
              ptr = ceci.rawShare(
                ptr,
                Emval.toHandle(fonction() {
                  clonedHandle['supprimer']();
                })
              );
              si (destructeurs !== null) {
                destructeurs.push(this.rawDestructor, ptr);
              }
            }
            casser;
  
          défaut:
            throwBindingError('Politique de partage non prise en charge');
        }
      }
      retourner ptr;
    }
  
  fonction nonConstNoSmartPtrRawPointerToWireType(destructeurs, handle) {
      si (poignée === null) {
        si (ceci.estRéférence) {
          throwBindingError('null n'est pas une valeur valide ' + this.name);
        }
        retourner 0;
      }
  
      si (!handle.$$) {
        throwBindingError('Impossible de transmettre "' + _embind_repr(handle) + '" en tant que ' + this.name);
      }
      si (!handle.$$.ptr) {
        throwBindingError('Impossible de transmettre l'objet supprimé en tant que pointeur de type ' + this.name);
      }
      si (handle.$$.ptrType.isConst) {
          throwBindingError('Impossible de convertir l'argument de type ' + handle.$$.ptrType.name + ' en paramètre de type ' + this.name);
      }
      var handleClass = handle.$$.ptrType.registeredClass;
      var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
      retourner ptr;
    }
  
  fonction simpleReadValueFromPointer(pointeur) {
      renvoyer ceci['fromWireType'](HEAPU32[pointeur >> 2]);
    }
  
  fonction RegisteredPointer_getPointee(ptr) {
      si (ceci.rawGetPointee) {
        ptr = this.rawGetPointee(ptr);
      }
      retourner ptr;
    }
  
  fonction RegisteredPointer_destructor(ptr) {
      si (ceci.rawDestructor) {
        ceci.rawDestructor(ptr);
      }
    }
  
  fonction RegisteredPointer_deleteObject(handle) {
      si (poignée !== null) {
        poignée['supprimer']();
      }
    }
  fonction init_RegisteredPointer() {
      RegisteredPointer.prototype.getPointee = RegisteredPointer_getPointee;
      RegisteredPointer.prototype.destructor = RegisteredPointer_destructor;
      RegisteredPointer.prototype['argPackAdvance'] = 8;
      RegisteredPointer.prototype['readValueFromPointer'] = simpleReadValueFromPointer;
      RegisteredPointer.prototype['deleteObject'] = RegisteredPointer_deleteObject;
      RegisteredPointer.prototype['fromWireType'] = RegisteredPointer_fromWireType;
    }
  /** @constructeur
      @param {*=}pointeeType,
      @param {*=} politique de partage,
      @param {*=} rawGetPointee,
      @param {*=} constructeur brut,
      @param {*=} rawShare,
      @param {*=} rawDestructor,
       */
  fonction RegisteredPointer(
      nom,
      Classe enregistrée,
      estRéférence,
      estConst,
  
      // propriétés du pointeur intelligent
      estSmartPointer,
      Type de pointe,
      Politique de partage,
      brutGetPointee,
      constructeur brut,
      rawShare,
      Destructeur brut
    ) {
      ceci.nom = nom;
      cette.classeenregistrée = Classeenregistrée;
      ceci.estRéférence = estRéférence;
      ceci.isConst = isConst;
  
      // propriétés du pointeur intelligent
      ceci.isSmartPointer = isSmartPointer;
      ceci.pointeeType = pointeeType;
      ceci.sharingPolicy = Politique de partage;
      ceci.rawGetPointee = rawGetPointee;
      ceci.rawConstructor = rawConstructor;
      ceci.rawShare = rawShare;
      ceci.rawDestructor = rawDestructor;
  
      si (!isSmartPointer && registeredClass.baseClass === indéfini) {
        si (isConst) {
          ceci['toWireType'] = constNoSmartPtrRawPointerToWireType;
          cette.destructorFunction = null;
        } autre {
          this['toWireType'] = nonConstNoSmartPtrRawPointerToWireType;
          cette.destructorFunction = null;
        }
      } autre {
        this['toWireType'] = genericPointerToWireType;
        // Ici, nous devons laisser this.destructorFunction indéfini, car si genericPointerToWireType renvoie
        // un pointeur qui doit être libéré dépend de l'exécution et ne peut pas être évalué au moment de l'enregistrement.
        // TODO : Créer un mécanisme alternatif qui permet de supprimer l'utilisation de var destructors = []; array in
        // craftInvokerFunction au total.
      }
    }
  
  /** @param {nombre=} numArguments */
  fonction replacePublicSymbol(nom, valeur, numArguments) {
      si (!Module.hasOwnProperty(nom)) {
        throwInternalError('Remplacement d'un symbole public inexistant');
      }
      // S'il existe une table de surcharge pour ce symbole, remplacez plutôt le symbole dans la table de surcharge.
      si (undefined !== Module[nom].overloadTable && undefined !== numArguments) {
        Module[nom].overloadTable[numArguments] = valeur ;
      }
      autre {
        Module[nom] = valeur;
        Module[nom].argCount = numArguments;
      }
    }
  
  fonction dynCallLegacy(sig, ptr, args) {
      assert(('dynCall_' + sig) dans le module, 'mauvais type de pointeur de fonction - pas de table pour sig \'' + sig + '\'');
      si (args && args.length) {
        // j (entier 64 bits) doit être transmis sous la forme de deux nombres [32 bas, 32 haut].
        assert(args.length === sig.substring(1).replace(/j/g, '--').length);
      } autre {
        assert(sig.length == 1);
      }
      var f = Module["dynCall_" + sig];
      renvoyer args && args.length ? f.apply(null, [ptr].concat(args)) : f.call(null, ptr);
    }
  /** @param {Object=} arguments */
  fonction dynCall(sig, ptr, args) {
      // Sans support WASM_BIGINT, nous ne pouvons pas appeler directement la fonction avec i64 comme
      // fait partie de leur signature, nous nous appuyons donc sur les fonctions dynCall générées par
      // wasm-emscripten-finaliser
      si (sig.includes('j')) {
        renvoyer dynCallLegacy(sig, ptr, args);
      }
      assert(getWasmTableEntry(ptr), 'entrée de table manquante dans dynCall : ' + ptr);
      renvoie getWasmTableEntry(ptr).apply(null, args)
    }
  fonction getDynCaller(sig, ptr) {
      assert(sig.includes('j'), 'getDynCaller ne doit être appelé qu'avec des signatures i64')
      var argCache = [];
      fonction de retour() {
        argCache.length = 0;
        Objet.assign(argCache, arguments);
        return dynCall(sig, ptr, argCache);
      };
    }
  fonction embind__requireFunction(signature, rawFunction) {
      signature = readLatin1String(signature);
  
      fonction makeDynCaller() {
        si (signature.includes('j')) {
          retourner getDynCaller(signature, rawFunction);
        }
        retourner getWasmTableEntry(rawFunction);
      }
  
      var fp = makeDynCaller();
      si (typeof fp != "fonction") {
          throwBindingError("pointeur de fonction inconnu avec signature " + signature + ": " + rawFunction);
      }
      retour fp;
    }
  
  var UnboundTypeError = non défini ;
  
  fonction getTypeName(type) {
      var ptr = ___getTypeName(type);
      var rv = readLatin1String(ptr);
      _libre(ptr);
      retourner le camping-car;
    }
  fonction throwUnboundTypeError(message, types) {
      var unboundTypes = [];
      var vu = {};
      fonction visite(type) {
        si (vu[type]) {
          retour;
        }
        si (registeredTypes[type]) {
          retour;
        }
        si (typeDependencies[type]) {
          typeDependencies[type].forEach(visite);
          retour;
        }
        unboundTypes.push(type);
        vu[type] = vrai;
      }
      types.forEach(visite);
  
      lancer une nouvelle UnboundTypeError(message + ': ' + unboundTypes.map(getTypeName).join([', ']));
    }
  fonction __embind_register_class(rawType,
                                     Type de pointeur brut,
                                     rawConstPointerType,
                                     baseClassRawType,
                                     obtenirActualTypeSignature,
                                     obtenir le type réel,
                                     upcastSignature,
                                     en colère,
                                     Signature abattue,
                                     abattu,
                                     nom,
                                     destructeurSignature,
                                     Destructeur brut) {
      nom = readLatin1String(nom);
      getActualType = embind__requireFunction(getActualTypeSignature, getActualType);
      si (upcast) {
        upcast = embind__requireFunction(upcastSignature, upcast);
      }
      si (abattu) {
        vers le bas = embind__requireFunction(downcastSignature, vers le bas);
      }
      rawDestructor = embind__requireFunction(destructorSignature, rawDestructor);
      var legalFunctionName = makeLegalFunctionName(nom);
  
      exposePublicSymbol(nom de la fonction légale, fonction() {
        // ce code ne peut pas s'exécuter si baseClassRawType est égal à zéro
        throwUnboundTypeError('Impossible de construire ' + name + ' en raison de types non liés', [baseClassRawType]);
      });
  
      lorsque les types dépendants sont résolus(
        [type brut, type de pointeur brut, type de pointeur brut constant],
        baseClassRawType ? [baseClassRawType] : [],
        fonction(base) {
          base = base[0];
  
          var baseClass;
          var basePrototype;
          si (baseClassRawType) {
            baseClass = base.registeredClass;
            basePrototype = baseClass.instancePrototype;
          } autre {
            basePrototype = ClassHandle.prototype;
          }
  
          var constructeur = createNamedFunction(legalFunctionName, function() {
            si (Object.getPrototypeOf(this) !== instancePrototype) {
              throw new BindingError("Utilisez 'new' pour construire " + name);
            }
            si (undefined === registeredClass.constructor_body) {
              throw new BindingError(name + " n'a pas de constructeur accessible");
            }
            var corps = registeredClass.constructor_body[arguments.length];
            si (indéfini === corps) {
              throw new BindingError("J'ai essayé d'invoquer le ctor de " + name + " avec un nombre de paramètres non valide (" + arguments.length + ") - paramètres attendus (" + Object.keys(registeredClass.constructor_body).toString() + ") à la place !");
            }
            retourner corps.apply(this, arguments);
          });
  
          var instancePrototype = Objet.create(basePrototype, {
            constructeur : { valeur : constructeur },
          });
  
          constructeur.prototype = instancePrototype;
  
          var registeredClass = nouvelle RegisteredClass(nom,
                                                    constructeur,
                                                    instancePrototype,
                                                    Destructeur brut,
                                                    classe de base,
                                                    obtenir le type réel,
                                                    en colère,
                                                    abattu);
  
          var referenceConverter = new RegisteredPointer (nom,
                                                         Classe enregistrée,
                                                         vrai,
                                                         FAUX,
                                                         FAUX);
  
          var pointerConverter = new RegisteredPointer(nom + '*',
                                                       Classe enregistrée,
                                                       FAUX,
                                                       FAUX,
                                                       FAUX);
  
          var constPointerConverter = new RegisteredPointer(nom + ' const*',
                                                            Classe enregistrée,
                                                            FAUX,
                                                            vrai,
                                                            FAUX);
  
          registeredPointers[rawType] = {
            pointerType : pointerConverter,
            constPointerType : constPointerConverter
          };
  
          replacePublicSymbol(legalFunctionName, constructeur);
  
          retourner [referenceConverter, pointerConverter, constPointerConverter];
        }
      );
    }

  fonction heap32VectorToArray(compte, premierElement) {
      
      var tableau = [];
      pour (var i = 0; i < nombre; i++) {
          tableau.push(HEAP32[(firstElement >> 2) + i]);
      }
      retourner un tableau ;
    }
  
  fonction runDestructors(destructeurs) {
      tandis que (destructeurs.length) {
        var ptr = destructeurs.pop();
        var del = destructeurs.pop();
        del(ptr);
      }
    }
  fonction __embind_register_class_constructor(
      Type de classe brute,
      argCount,
      rawArgTypesAddr,
      Signature de l'invocateur,
      invocateur,
      constructeur brut
    ) {
      assert(argCount > 0);
      var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
      invocateur = embind__requireFunction(invocateurSignature, invocateur);
      var args = [rawConstructor];
      var destructeurs = [];
  
      lorsque les types dépendants sont résolus ([], [rawClassType], fonction (classType) {
        classeType = classeType[0];
        var humanName = 'constructeur ' + classType.name;
  
        si (indéfini === classType.registeredClass.constructor_body) {
          classType.registeredClass.constructor_body = [];
        }
        si (indéfini !== classType.registeredClass.constructor_body[argCount - 1]) {
          throw new BindingError("Impossible d'enregistrer plusieurs constructeurs avec le même nombre de paramètres (" + (argCount-1) + ") pour la classe '" + classType.name + "'! La résolution de surcharge n'est actuellement effectuée qu'à l'aide du nombre de paramètres, et non des informations de type réelles !");
        }
        classType.registeredClass.constructor_body[argCount - 1] = () => {
          throwUnboundTypeError('Impossible de construire ' + classType.name + ' en raison de types non liés', rawArgTypes);
        };
  
        lorsque les types dépendants sont résolus ([], rawArgTypes, fonction (argTypes) {
          // Insérer un emplacement vide pour le type de contexte (argTypes[1]).
          argTypes.splice(1, 0, null);
          classType.registeredClass.constructor_body[argCount - 1] = craftInvokerFunction(humanName, argTypes, null, invoker, rawConstructor);
          retour [];
        });
        retour [];
      });
    }

  fonction new_(constructeur, argumentList) {
      si (!(instance du constructeur de la fonction)) {
        throw new TypeError('new_ appelé avec le type de constructeur ' + typeof(constructor) + " qui n'est pas une fonction");
      }
      /*
       * Auparavant, la ligne suivante était simplement :
       * fonction factice() {};
       * Malheureusement, Chrome conservait « dummy » comme nom de l'objet, même
       * bien qu'à la création, le « mannequin » possède le nom de constructeur correct. Ainsi,
       * les objets créés avec IMVU.new apparaîtraient dans le débogueur comme « factices »,
       * ce qui n'est pas très utile. L'utilisation de IMVU.createNamedFunction résout le problème
       * problème. Doublement-malheureusement, il n'y a aucun moyen d'écrire un test pour cela
       * comportement. -NRD 2013.02.22
       */
      var dummy = createNamedFunction(constructeur.name || 'unknownFunctionName', function(){});
      dummy.prototype = constructeur.prototype;
      var obj = nouveau mannequin;
  
      var r = constructeur.apply(obj, argumentList);
      retourner (r instanceof Object) ? r : obj ;
    }
  fonction craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc) {
      // humanName : un nom de chaîne lisible par l'homme pour la fonction à générer.
      // argTypes : un tableau qui contient les objets de type embind pour tous les types dans la signature de fonction.
      // argTypes[0] est l'objet type pour la valeur de retour de la fonction.
      // argTypes[1] est l'objet de type pour la fonction de ce type d'objet/classe, ou null si aucun appelant n'est créé pour une méthode de classe.
      // argTypes[2...] sont les paramètres de fonction réels.
      // classType : l'objet de type embind pour la classe à lier, ou null s'il ne s'agit pas d'une méthode d'une classe.
      // cppInvokerFunc : objet de fonction JS vers la fonction côté C++ qui s'interopère dans le code C++.
      // cppTargetFunc : pointeur de fonction (un entier vers FUNCTION_TABLE) vers la fonction C++ cible que cppInvokerFunc finira par appeler.
      var argCount = argTypes.longueur;
  
      si (argCount < 2) {
        throwBindingError("La taille du tableau argTypes ne correspond pas ! Il faut au moins obtenir la valeur de retour et les types « this » !");
      }
  
      var isClassMethodFunc = (argTypes[1] !== null && classType !== null);
  
      // Les fonctions libres avec la signature « void function() » n'ont pas besoin d'un appelant qui effectue la répartition entre les types de fils.
  // TODO : ceci omet la vérification du nombre d'arguments - activer uniquement sur -O3 ou similaire.
  // si (ENABLE_UNSAFE_OPTS && argCount == 2 && argTypes[0].name == "void" && !isClassMethodFunc) {
  // renvoie FUNCTION_TABLE[fn];
  // }
  
      // Déterminer si nous devons utiliser une pile dynamique pour stocker les destructeurs des paramètres de fonction.
      // TODO : supprimez ceci complètement une fois que tous les invocateurs de fonction sont générés dynamiquement.
      var needDestructorStack = false;
  
      for (var i = 1; i < argTypes.length; ++i) { // Ignorer la valeur de retour à l'index 0 - elle n'est pas supprimée ici.
        if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) { // Le type ne définit pas de fonction destructrice - doit utiliser une pile dynamique
          besoinsDestructorStack = vrai;
          casser;
        }
      }
  
      var renvoie = (argTypes[0].name !== "void");
  
      var argsList = "";
      var argsListWired = "";
      pour (var i = 0; i < argCount - 2; ++i) {
        argsList += (i!==0?", ":"")+"arg"+i;
        argsListCâblé += (i!==0?", ":"")+"arg"+i+"Câblé";
      }
  
      var invokerFnBody =
          "fonction de retour "+makeLegalFunctionName(humanName)+"("+argsList+") {\n" +
          "si (arguments.length !== "+(argCount - 2)+") {\n" +
              "throwBindingError('function "+humanName+" appelée avec ' + arguments.length + ' arguments, attendu "+(argCount - 2)+" args!');\n" +
          "}\n";
  
      si (nécessiteDestructorStack) {
        invokerFnBody += "var destructeurs = [];\n";
      }
  
      var dtorStack = besoinsDestructorStack ? "destructeurs" : "null";
      var args1 = ["throwBindingError", "invoker", "fn", "runDestructors", "retType", "classParam"];
      var args2 = [throwBindingError, cppInvokerFunc, cppTargetFunc, runDestructors, argTypes[0], argTypes[1]];
  
      si (isClassMethodFunc) {
        invokerFnBody += "var thisWired = classParam.toWireType("+dtorStack+", this);\n";
      }
  
      pour (var i = 0; i < argCount - 2; ++i) {
        invokerFnBody += "var arg"+i+"Wired = argType"+i+".toWireType("+dtorStack+", arg"+i+"); // "+argTypes[i+2].name+"\n";
        args1.push("argType"+i);
        args2.push(argTypes[i+2]);
      }
  
      si (isClassMethodFunc) {
        argsListWired = "thisWired" + (argsListWired.length > 0 ? ", " : "") + argsListWired;
      }
  
      invokerFnBody +=
          (renvoie ?"var rv = ":"") + "invoker(fn"+(argsListWired.length>0 ?", ":"")+argsListWired+");\n";
  
      si (nécessiteDestructorStack) {
        invokerFnBody += "runDestructors(destructeurs);\n";
      } autre {
        for (var i = isClassMethodFunc?1:2; i < argTypes.length; ++i) { // Ignorer la valeur de retour à l'index 0 - elle n'est pas supprimée ici. Ignorer également le type de classe s'il ne s'agit pas d'une méthode.
          var paramName = (i === 1 ? "thisWired" : ("arg"+(i - 2)+"Wired"));
          si (argTypes[i].destructorFunction !== null) {
            invokerFnBody += paramName+"_dtor("+paramName+"); // "+argTypes[i].name+"\n";
            args1.push(paramName+"_dtor");
            args2.push(argTypes[i].destructorFunction);
          }
        }
      }
  
      si (retourne) {
        invocateurFnBody += "var ret = retType.fromWireType(rv);\n" +
                         "retour ret;\n";
      } autre {
      }
  
      invokerFnBody += "}\n";
  
      args1.push(invokerFnBody);
  
      var invokerFunction = new_(Fonction, args1).apply(null, args2);
      retourner invokerFunction;
    }
  fonction __embind_register_class_function(rawClassType,
                                              nom de la méthode,
                                              argCount,
                                              rawArgTypesAddr, // [Type de retour, Ce type, Args...]
                                              Signature de l'invocateur,
                                              invocateur brut,
                                              contexte,
                                              estPureVirtual) {
      var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
      methodName = readLatin1String(methodName);
      rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
  
      lorsque les types dépendants sont résolus ([], [rawClassType], fonction (classType) {
        classeType = classeType[0];
        var humanName = classType.name + '.' + methodName;
  
        si (methodName.startsWith("@@")) {
          methodName = Symbole[methodName.substring(2)];
        }
  
        si (isPureVirtual) {
          classType.registeredClass.pureVirtualFunctions.push(methodName);
        }
  
        fonction unboundTypesHandler() {
          throwUnboundTypeError('Impossible d'appeler ' + humanName + ' en raison de types non liés', rawArgTypes);
        }
  
        var proto = classType.registeredClass.instancePrototype;
        var méthode = proto[nom de la méthode];
        si (undefined === méthode || (undefined === méthode.overloadTable && méthode.className !== classType.name && méthode.argCount === argCount - 2)) {
          // Il s'agit de la première surcharge à être enregistrée, OU nous remplaçons une
          // fonction dans la classe de base avec une fonction dans la classe dérivée.
          unboundTypesHandler.argCount = argCount - 2;
          unboundTypesHandler.className = classType.name;
          proto[methodName] = unboundTypesHandler;
        } autre {
          // Il existait une fonction enregistrée portant le même nom. Configurer
          // une table de routage de surcharge de fonction.
          ensureOverloadTable(proto, methodName, humanName);
          proto[methodName].overloadTable[argCount - 2] = unboundTypesHandler;
        }
  
        lorsque les types dépendants sont résolus ([], rawArgTypes, fonction (argTypes) {
          var memberFunction = craftInvokerFunction(humanName, argTypes, classType, rawInvoker, contexte);
  
          // Remplacez la fonction initiale unbound-handler-stub par la fonction membre appropriée, maintenant que tous les types
          // sont résolus. Si plusieurs surcharges sont enregistrées pour cette fonction, la fonction passe dans une table de surcharge.
          si (undefined === proto[methodName].overloadTable) {
            // Définir argCount au cas où une surcharge serait enregistrée ultérieurement
            memberFunction.argCount = argCount - 2;
            proto[methodName] = memberFunction;
          } autre {
            proto[methodName].overloadTable[argCount - 2] = memberFunction;
          }
  
          retour [];
        });
        retour [];
      });
    }

  fonction validateThis(this_, classType, humanName) {
      si (!(cet_instanceof Objet)) {
        throwBindingError(humanName + ' avec "this" non valide : ' + this_);
      }
      si (!(cette_instancede classType.registeredClass.constructor)) {
        throwBindingError(humanName + ' incompatible avec "this" de type ' + this_.constructor.name);
      }
      si (!this_.$$.ptr) {
        throwBindingError('impossible d'appeler la méthode de liaison emscripten ' + humanName + ' sur l'objet supprimé');
      }
  
      // à faire : tuer ceci
      renvoie upcastPointer(this_.$$.ptr,
                           cette_.$$.ptrType.classeenregistrée,
                           classeType.classeenregistrée);
    }
  fonction __embind_register_class_property(classType,
                                              nom du champ,
                                              getterReturnType,
                                              Signature du getter,
                                              accédant,
                                              getterContext,
                                              setterArgumentType,
                                              Signature du setter,
                                              setter,
                                              (setterContext) {
      fieldName = readLatin1String(fieldName);
      getter = embind__requireFunction(getterSignature, getter);
  
      lorsque les types dépendants sont résolus ([], [classType], fonction (classType) {
        classeType = classeType[0];
        var humanName = classType.name + '.' + fieldName;
        var desc = {
          obtenir : fonction() {
            throwUnboundTypeError('Impossible d'accéder à ' + humanName + ' en raison de types non liés', [getterReturnType, setterArgumentType]);
          },
          énumérable : vrai,
          configurable : vrai
        };
        si (setter) {
          desc.set = () => {
            throwUnboundTypeError('Impossible d'accéder à ' + humanName + ' en raison de types non liés', [getterReturnType, setterArgumentType]);
          };
        } autre {
          desc.set = (v) => {
            throwBindingError(humanName + ' est une propriété en lecture seule');
          };
        }
  
        Objet.defineProperty(classType.registeredClass.instancePrototype, fieldName, desc);
  
        lorsque les types dépendants sont résolus(
          [],
          (setter ? [getterReturnType, setterArgumentType] : [getterReturnType]),
      fonction(types) {
          var getterReturnType = types[0];
          var desc = {
            obtenir : fonction() {
              var ptr = validateThis(this, classType, humanName + ' getter ');
              renvoyer getterReturnType['fromWireType'](getter(getterContext, ptr));
            },
            dénombrable : vrai
          };
  
          si (setter) {
            setter = embind__requireFunction(setterSignature, setter);
            var setterArgumentType = types[1];
            desc.set = fonction(v) {
              var ptr = validateThis(this, classType, humanName + ' setter ');
              var destructeurs = [];
              setter(setterContext, ptr, setterArgumentType['toWireType'](destructeurs, v));
              runDestructors(destructeurs);
            };
          }
  
          Objet.defineProperty(classType.registeredClass.instancePrototype, fieldName, desc);
          retour [];
        });
  
        retour [];
      });
    }

  var emval_free_list = [];
  
  var emval_handle_array = [{},{valeur : non défini},{valeur : null},{valeur : vrai},{valeur : faux}];
  fonction __emval_decref(poignée) {
      si (poignée > 4 && 0 === --emval_handle_array[poignée].refcount) {
        emval_handle_array[handle] = indéfini;
        emval_free_list.push(poignée);
      }
    }
  
  fonction count_emval_handles() {
      var nombre = 0;
      pour (var i = 5; i < emval_handle_array.length; ++i) {
        si (emval_handle_array[i] !== indéfini) {
          ++compter;
        }
      }
      nombre de retours ;
    }
  
  fonction get_first_emval() {
      pour (var i = 5; i < emval_handle_array.length; ++i) {
        si (emval_handle_array[i] !== indéfini) {
          retourner emval_handle_array[i];
        }
      }
      retourner null;
    }
  fonction init_emval() {
      Module['count_emval_handles'] = count_emval_handles;
      Module['get_first_emval'] = get_first_emval;
    }
  var Emval = {toValue:(poignée) => {
        si (!handle) {
            throwBindingError('Impossible d'utiliser la valeur supprimée. handle = ' + handle);
        }
        renvoyer emval_handle_array[handle].valeur ;
      },toHandle:(valeur) => {
        commutateur (valeur) {
          cas indéfini : retour 1 ;
          cas nul : retour 2 ;
          cas vrai : retour 3 ;
          cas faux : retour 4 ;
          défaut:{
            var handle = emval_free_list.length ?
                emval_free_list.pop() :
                emval_handle_array.longueur;
  
            emval_handle_array[handle] = {refcount : 1, valeur : valeur} ;
            poignée de retour;
          }
        }
      }};
  fonction __embind_register_emval(rawType, nom) {
      nom = readLatin1String(nom);
      registerType(type brut, {
        nom: nom,
        'fromWireType': fonction(poignée) {
          var rv = Emval.toValue(poignée);
          __emval_decref(poignée);
          retourner le camping-car;
        },
        'toWireType': fonction(destructeurs, valeur) {
          retourner Emval.toHandle(valeur);
        },
        'argPackAdvance': 8,
        'readValueFromPointer': simpleReadValueFromPointer,
        destructorFunction : null, // Ce type n'a pas besoin de destructeur
  
        // TODO : avons-nous besoin d'un deleteObject ici ? écrivez un test où
        // emval est passé à JS via une interface
      });
    }

  fonction _embind_repr(v) {
      si (v === nul) {
          retourner 'null';
      }
      var t = type de v;
      si (t === 'objet' || t === 'tableau' || t === 'fonction') {
          renvoie v.toString();
      } autre {
          retour '' + v;
      }
    }
  
  fonction floatReadValueFromPointer(nom, décalage) {
      changer (décaler) {
          cas 2 : fonction de retour (pointeur) {
              renvoyer ceci['fromWireType'](HEAPF32[pointeur >> 2]);
          };
          cas 3 : fonction de retour (pointeur) {
              renvoyer ceci['fromWireType'](HEAPF64[pointeur >> 3]);
          };
          défaut:
              throw new TypeError("Type de flotteur inconnu : " + nom);
      }
    }
  fonction __embind_register_float(rawType, nom, taille) {
      var shift = getShiftFromSize(taille);
      nom = readLatin1String(nom);
      registerType(type brut, {
          nom: nom,
          'fromWireType': fonction(valeur) {
               valeur de retour;
          },
          'toWireType': fonction(destructeurs, valeur) {
              si (typeof valeur != "nombre" && typeof valeur != "booléen") {
                  throw new TypeError('Impossible de convertir "' + _embind_repr(value) + '" en ' + this.name);
              }
              // La VM effectuera une conversion de valeur JS en Wasm, conformément à la spécification :
              // https://www.w3.org/TR/wasm-js-api-1/#towebassemblyvalue
              valeur de retour;
          },
          'argPackAdvance': 8,
          'readValueFromPointer': floatReadValueFromPointer(nom, décalage),
          destructorFunction : null, // Ce type n'a pas besoin de destructeur
      });
    }

  fonction __embind_register_function(nom, argCount, rawArgTypesAddr, signature, rawInvoker, fn) {
      var argTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
      nom = readLatin1String(nom);
  
      rawInvoker = embind__requireFunction(signature, rawInvoker);
  
      exposePublicSymbol(nom, fonction() {
          throwUnboundTypeError('Impossible d'appeler ' + name + ' en raison de types non liés', argTypes);
      }, argCount - 1);
  
      lorsque les types dépendants sont résolus ([], argTypes, fonction (argTypes) {
          var invokerArgsArray = [argTypes[0] /* valeur de retour */, null /* aucune classe 'this'*/].concat(argTypes.slice(1) /* paramètres réels */);
          replacePublicSymbol(nom, craftInvokerFunction(nom, invokerArgsArray, null /* aucune classe 'this'*/, rawInvoker, fn), argCount - 1);
          retour [];
      });
    }

  fonction entierReadValueFromPointer(nom, décalage, signé) {
      // les entiers sont assez courants, donc générez des fonctions très spécialisées
      changer (décaler) {
          cas 0 : retour signé ?
              fonction readS8FromPointer(pointeur) { return HEAP8[pointeur]; } :
              fonction readU8FromPointer(pointeur) { return HEAPU8[pointeur]; };
          cas 1 : retour signé ?
              fonction readS16FromPointer(pointeur) { return HEAP16[pointeur >> 1]; } :
              fonction readU16FromPointer(pointeur) { return HEAPU16[pointeur >> 1]; };
          cas 2 : retour signé ?
              fonction readS32FromPointer(pointeur) { return HEAP32[pointeur >> 2]; } :
              fonction readU32FromPointer(pointeur) { return HEAPU32[pointeur >> 2]; };
          défaut:
              throw new TypeError("Type entier inconnu : " + nom);
      }
    }
  fonction __embind_register_integer(primitiveType, nom, taille, minRange, maxRange) {
      nom = readLatin1String(nom);
      if (maxRange === -1) { // LLVM n'a pas de types 32 bits signés et non signés, donc les littéraux u32 apparaissent comme « i32 -1 ». Traitez-les toujours comme max u32.
          maxRange = 4294967295;
      }
  
      var shift = getShiftFromSize(taille);
  
      var fromWireType = (valeur) => valeur ;
  
      si (minRange === 0) {
          var bitshift = 32 - 8*taille ;
          fromWireType = (valeur) => (valeur << décalage de bits) >>> décalage de bits ;
      }
  
      var isUnsignedType = (nom.includes('non signé'));
      var checkAssertions = (valeur, toTypeName) => {
          si (typeof valeur != "nombre" && typeof valeur != "booléen") {
              throw new TypeError('Impossible de convertir "' + _embind_repr(value) + '" en ' + toTypeName);
          }
          si (valeur < minRange || valeur > maxRange) {
              throw new TypeError('Transmission d'un nombre "' + _embind_repr(value) + '" du côté JS au côté C/C++ à un argument de type "' + name + '", qui est en dehors de la plage valide [' + minRange + ', ' + maxRange + ']!');
          }
      }
      var àWireType;
      si (isUnsignedType) {
          toWireType = fonction(destructeurs, valeur) {
              checkAssertions(valeur, this.name);
              valeur de retour >>> 0;
          }
      } autre {
          toWireType = fonction(destructeurs, valeur) {
              checkAssertions(valeur, this.name);
              // La VM effectuera une conversion de valeur JS en Wasm, conformément à la spécification :
              // https://www.w3.org/TR/wasm-js-api-1/#towebassemblyvalue
              valeur de retour;
          }
      }
      registerType(typeprimitif, {
          nom: nom,
          'fromWireType': à partir deWireType,
          'toWireType': toWireType,
          'argPackAdvance': 8,
          'readValueFromPointer': entierReadValueFromPointer(nom, décalage, minRange !== 0),
          destructorFunction : null, // Ce type n'a pas besoin de destructeur
      });
    }

  fonction __embind_register_memory_view(rawType, dataTypeIndex, nom) {
      var typeMapping = [
        Int8Array,
        Tableau Uint8,
        Int16Array,
        Tableau Uint16,
        Tableau Int32,
        Tableau Uint32,
        Tableau Float32,
        Tableau Float64,
      ];
  
      var TA = typeMapping[dataTypeIndex];
  
      fonction decodeMemoryView(handle) {
        poignée = poignée >> 2;
        var tas = HEAPU32;
        var size = heap[handle]; // dans les éléments
        var data = heap[handle + 1]; // décalage d'octet dans le tas emscripten
        renvoyer un nouveau TA(buffer, data, size);
      }
  
      nom = readLatin1String(nom);
      registerType(type brut, {
        nom: nom,
        'fromWireType': décoderMemoryView,
        'argPackAdvance': 8,
        'readValueFromPointer': décoderMemoryView,
      }, {
        ignoreDuplicateRegistrations : vrai,
      });
    }

  fonction __embind_register_std_string(rawType, nom) {
      nom = readLatin1String(nom);
      var stdStringIsUTF8
      //traiter uniquement les liaisons std::string avec prise en charge UTF8, contrairement à par exemple std::basic_string<unsigned char>
      = (nom === "std::string");
  
      registerType(type brut, {
          nom: nom,
          'fromWireType': fonction(valeur) {
              var longueur = HEAPU32[valeur >> 2];
  
              var chaîne;
              si (stdStringIsUTF8) {
                  var decodeStartPtr = valeur + 4 ;
                  // Boucle ici pour prendre en charge les éventuels octets « 0 » intégrés
                  pour (var i = 0; i <= longueur; ++i) {
                      var currentBytePtr = valeur + 4 + i ;
                      si (i == longueur || HEAPU8[currentBytePtr] == 0) {
                          var maxRead = currentBytePtr - decodeStartPtr;
                          var stringSegment = UTF8ToString(decodeStartPtr, maxRead);
                          si (str === indéfini) {
                              str = chaîneSegment;
                          } autre {
                              str += Chaîne.fromCharCode(0);
                              str += chaîneSegment;
                          }
                          décoderStartPtr = currentBytePtr + 1;
                      }
                  }
              } autre {
                  var a = nouveau tableau(longueur);
                  pour (var i = 0; i < longueur; ++i) {
                      a[i] = String.fromCharCode(HEAPU8[valeur + 4 + i]);
                  }
                  str = a.join('');
              }
  
              _free(valeur);
  
              retourner str;
          },
          'toWireType': fonction(destructeurs, valeur) {
              si (valeur instanceof ArrayBuffer) {
                  valeur = nouveau Uint8Array(valeur);
              }
  
              var getLength;
              var valueIsOfTypeString = (typeof value == 'string');
  
              si (!(valueIsOfTypeString || valeur instanceof Uint8Array || valeur instanceof Uint8ClampedArray || valeur instanceof Int8Array)) {
                  throwBindingError('Impossible de transmettre une valeur non-chaîne à std::string');
              }
              si (stdStringIsUTF8 && valueIsOfTypeString) {
                  getLength = () => lengthBytesUTF8(valeur);
              } autre {
                  getLength = () => valeur.length;
              }
  
              // suppose un alignement sur 4 octets
              var longueur = getLength();
              var ptr = _malloc(4 + longueur + 1);
              HEAPU32[ptr >> 2] = longueur ;
              si (stdStringIsUTF8 && valueIsOfTypeString) {
                  stringToUTF8(valeur, ptr + 4, longueur + 1);
              } autre {
                  si (valueIsOfTypeString) {
                      pour (var i = 0; i < longueur; ++i) {
                          var charCode = valeur.charCodeAt(i);
                          si (charCode > 255) {
                              _libre(ptr);
                              throwBindingError('La chaîne contient des unités de code UTF-16 qui ne tiennent pas dans 8 bits');
                          }
                          HEAPU8[ptr + 4 + i] = charCode;
                      }
                  } autre {
                      pour (var i = 0; i < longueur; ++i) {
                          HEAPU8[ptr + 4 + i] = valeur[i];
                      }
                  }
              }
  
              si (destructeurs !== null) {
                  destructeurs.push(_free, ptr);
              }
              retourner ptr;
          },
          'argPackAdvance': 8,
          'readValueFromPointer': simpleReadValueFromPointer,
          destructorFunction : fonction(ptr) { _free(ptr); },
      });
    }

  fonction __embind_register_std_wstring(rawType, charSize, nom) {
      nom = readLatin1String(nom);
      var decodeString, encodeString, getHeap, lengthBytesUTF, shift;
      si (charSize === 2) {
        décoderString = UTF16ToString;
        encodeString = chaîneVersUTF16;
        longueurBytesUTF = longueurBytesUTF16;
        getHeap = () => HEAPU16;
        décalage = 1;
      } sinon si (charSize === 4) {
        décoderString = UTF32ToString;
        encodeString = chaîneVersUTF32;
        longueurBytesUTF = longueurBytesUTF32;
        getHeap = () => HEAPU32;
        décalage = 2;
      }
      registerType(type brut, {
        nom: nom,
        'fromWireType': fonction(valeur) {
          // Code principalement tiré de _embind_register_std_string de WireType
          var longueur = HEAPU32[valeur >> 2];
          var HEAP = getHeap();
          var chaîne;
  
          var decodeStartPtr = valeur + 4 ;
          // Boucle ici pour prendre en charge les éventuels octets « 0 » intégrés
          pour (var i = 0; i <= longueur; ++i) {
            var currentBytePtr = valeur + 4 + i * charSize;
            si (i == longueur || HEAP[currentBytePtr >> shift] == ​​0) {
              var maxReadBytes = currentBytePtr - decodeStartPtr;
              var stringSegment = decodeString(decodeStartPtr, maxReadBytes);
              si (str === indéfini) {
                str = chaîneSegment;
              } autre {
                str += Chaîne.fromCharCode(0);
                str += chaîneSegment;
              }
              décoderStartPtr = currentBytePtr + charSize;
            }
          }
  
          _free(valeur);
  
          retourner str;
        },
        'toWireType': fonction(destructeurs, valeur) {
          si (!(typeof valeur == 'chaîne')) {
            throwBindingError('Impossible de transmettre une valeur non-chaîne au type de chaîne C++ ' + name);
          }
  
          // suppose un alignement sur 4 octets
          var length = lengthBytesUTF(valeur);
          var ptr = _malloc(4 + longueur + charSize);
          HEAPU32[ptr >> 2] = longueur >> décalage ;
  
          encodeString(valeur, ptr + 4, longueur + charSize);
  
          si (destructeurs !== null) {
            destructeurs.push(_free, ptr);
          }
          retourner ptr;
        },
        'argPackAdvance': 8,
        'readValueFromPointer': simpleReadValueFromPointer,
        destructorFunction : fonction(ptr) { _free(ptr); },
      });
    }

  fonction __embind_register_void(rawType, nom) {
      nom = readLatin1String(nom);
      registerType(type brut, {
          isVoid : true, // les valeurs de retour void peuvent parfois être optimisées
          nom: nom,
          'argPackAdvance': 0,
          'fromWireType': fonction() {
              retourner indéfini;
          },
          'toWireType': fonction(destructeurs, o) {
              // TODO : affirmer si autre chose est donné ?
              retourner indéfini;
          },
      });
    }

  fonction __emscripten_date_now() {
      renvoie Date.now();
    }

  var nowIsMonotonic = true;;
  fonction __emscripten_get_now_is_monotonic() {
      retourner maintenantIsMonotonic;
    }


  fonction __emval_incref(poignée) {
      si (poignée > 4) {
        emval_handle_array[handle].refcount += 1;
      }
    }

  fonction requireRegisteredType(rawType, humanName) {
      var impl = registeredTypes[rawType];
      si (indéfini === impl) {
          throwBindingError(humanName + " a un type inconnu " + getTypeName(rawType));
      }
      retour imp;
    }
  fonction __emval_take_value(type, argv) {
      type = requireRegisteredType(type, '_emval_take_value');
      var v = type['readValueFromPointer'](argv);
      retourner Emval.toHandle(v);
    }

  var PATH = {splitPath:function(nom de fichier) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        renvoyer splitPathRe.exec(nom de fichier).slice(1);
      },normalizeArray:function(pièces, allowAboveRoot) {
        // si le chemin essaie d'aller au-dessus de la racine, `up` finit par > 0
        var en haut = 0;
        pour (var i = parties.length - 1; i >= 0; i--) {
          var dernière = parties[i];
          si (dernier === '.') {
            pièces.splice(i, 1);
          } sinon si (dernier === '..') {
            pièces.splice(i, 1);
            en haut++;
          } sinon si (en haut) {
            pièces.splice(i, 1);
            en haut--;
          }
        }
        // si le chemin est autorisé à aller au-delà de la racine, restaurer les ..s de début
        si (autoriserAboveRoot) {
          pour (; en haut; en haut--) {
            pièces.unshift('..');
          }
        }
        retourner des pièces;
      },normaliser:fonction(chemin) {
        var isAbsolute = chemin.charAt(0) === '/',
            trailingSlash = chemin.substr(-1) === '/';
        // Normaliser le chemin
        chemin = CHEMIN.normalizeArray(chemin.split('/').filter(fonction(p) {
          retour !!p;
        }), !isAbsolute).join('/');
        si (!chemin && !estAbsolu) {
          chemin = '.';
        }
        si (chemin && barre oblique de fin) {
          chemin += '/';
        }
        retour (isAbsolute ? '/' : '') + chemin ;
      },dirname:function(chemin) {
        var résultat = PATH.splitPath(chemin),
            racine = résultat[0],
            dir = résultat[1];
        si (!root && !dir) {
          // Aucun nom de répertoire quel qu'il soit
          retour '.';
        }
        si (dir) {
          // Il a un nom de répertoire, supprimez la barre oblique de fin
          dir = dir.substr(0, dir.length - 1);
        }
        retourner la racine + dir;
      },basename:function(chemin) {
        // EMSCRIPTEN renvoie '/'' pour '/', pas une chaîne vide
        si (chemin === '/') renvoie '/';
        chemin = CHEMIN.normalize(chemin);
        chemin = chemin.replace(/\/$/, "");
        var lastSlash = chemin.lastIndexOf('/');
        si (lastSlash === -1) renvoie le chemin ;
        chemin de retour.substr(lastSlash+1);
      },extname:function(chemin) {
        renvoie PATH.splitPath(chemin)[3];
      },joindre:fonction() {
        var chemins = Array.prototype.slice.call(arguments, 0);
        renvoie PATH.normalize(paths.join('/'));
      },join2:fonction(l, r) {
        retourner PATH.normalize(l + '/' + r);
      }};
  
  fonction getRandomDevice() {
      si (typeof crypto == 'objet' && typeof crypto['getRandomValues'] == 'fonction') {
        // pour les navigateurs Web modernes
        var randomBuffer = new Uint8Array(1);
        fonction de retour() { crypto.getRandomValues(randomBuffer); renvoie randomBuffer[0]; };
      } autre
      si (ENVIRONNEMENT_EST_NOEUD) {
        // pour nodejs avec ou sans support crypto inclus
        essayer {
          var crypto_module = require('crypto');
          // nodejs prend en charge la cryptographie
          fonction de retour() { renvoie crypto_module['randomBytes'](1)[0]; };
        } attraper (e) {
          // nodejs n'a pas de support cryptographique
        }
      }
      // nous n'avons pas pu trouver d'implémentation appropriée, car Math.random() n'est pas adapté à /dev/random, voir emscripten-core/emscripten/pull/7096
      return function() { abort("aucun support cryptographique trouvé pour randomDevice. envisagez de le polyfiller si vous souhaitez utiliser quelque chose de non sécurisé comme Math.random(), par exemple mettez ceci dans un --pre-js : var crypto = { getRandomValues: function(array) { for (var i = 0; i < array.length; i++) array[i] = (Math.random()*256)|0 } };"); };
    }
  
  var PATH_FS = {résolution:fonction() {
        var cheminrésolu = '',
          résoluAbsolu = faux;
        pour (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Ignorer les entrées vides et non valides
          si (typeof chemin != 'string') {
            throw new TypeError('Les arguments de path.resolve doivent être des chaînes');
          } sinon si (!chemin) {
            retour ''; // une partie invalide invalide l'ensemble
          }
          resolvePath = chemin + '/' + resolvePath;
          résoluAbsolute = path.charAt(0) === '/';
        }
        // À ce stade, le chemin doit être résolu en un chemin absolu complet, mais
        // gérer les chemins relatifs pour plus de sécurité (cela peut se produire lorsque process.cwd() échoue)
        cheminrésolu = CHEMIN.normalizeArray(cheminrésolu.split('/').filter(fonction(p) {
          retour !!p;
        }), !résoluAbsolu).join('/');
        retour ((résoluAbsolu ? '/' : '') + résoluChemin) || '.';
      },relatif:fonction(de, à) {
        de = PATH_FS.resolve(de).substr(1);
        à = PATH_FS.resolve(à).substr(1);
        fonction trim(arr) {
          var début = 0;
          pour (; début < arr.length; début++) {
            si (arr[début] !== '') pause;
          }
          var fin = arr.longueur - 1;
          pour (; fin >= 0; fin--) {
            si (arr[end] !== '') pause;
          }
          si (début > fin) retourne [];
          retourner arr.slice(début, fin - début + 1);
        }
        var à partir deParties = trim(à partir de.split('/'));
        var toParts = trim(to.split('/'));
        var longueur = Math.min(fromParts.length, toParts.length);
        var samePartsLength = longueur;
        pour (var i = 0; i < longueur; i++) {
          si (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            casser;
          }
        }
        var outputParts = [];
        pour (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        renvoyer outputParts.join('/');
      }};
  
  var TTY = {ttys:[],init:function() {
        // https://github.com/emscripten-core/emscripten/pull/1555
        // si (ENVIRONNEMENT_EST_NOEUD) {
        // // actuellement, FS.init ne fait pas la distinction si process.stdin est un fichier ou un TTY
        // // périphérique, il suppose toujours qu'il s'agit d'un périphérique TTY. à cause de cela, nous forçons
        // // process.stdin en encodage UTF8 pour au moins rendre la lecture stdin compatible
        // // avec des fichiers texte jusqu'à ce que FS.init puisse être refactorisé.
        // processus['stdin']['setEncoding']('utf8');
        // }
      },arrêt:fonction() {
        // https://github.com/emscripten-core/emscripten/pull/1555
        // si (ENVIRONNEMENT_EST_NOEUD) {
        // // inolen : une idée de la raison pour laquelle node -e 'process.stdin.read()' ne se ferme pas immédiatement (process.stdin étant un tty) ?
        // // isaacs : parce qu'il lit maintenant le flux, vous avez manifesté votre intérêt pour celui-ci, donc read() lance un _read() qui crée une opération ReadReq
        // // inolen : je pensais que read() dans ce cas était une opération synchrone qui récupérait simplement une certaine quantité de données mises en mémoire tampon si elles existent ?
        // // isaacs : c'est vrai. mais cela déclenche également un appel _read(), qui appelle readStart() sur le handle
        // // isaacs : faites process.stdin.pause() et je pense que cela fermerait probablement l'appel en attente
        // processus['stdin']['pause']();
        // }
      },registre:fonction(dev, ops) {
        TTY.ttys[dev] = { entrée : [], sortie : [], ops : ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops : {open : function(stream) {
          var tty = TTY.ttys[stream.node.rdev];
          si (!tty) {
            lancer une nouvelle FS.ErrnoError(43);
          }
          flux.tty = tty;
          flux.seekable = faux;
        },fermer:fonction(flux) {
          // vider toutes les données de ligne en attente
          flux.tty.ops.flush(flux.tty);
        },flush:function(flux) {
          flux.tty.ops.flush(flux.tty);
        },read:function(flux, tampon, décalage, longueur, pos /* ignoré */) {
          si (!stream.tty || !stream.tty.ops.get_char) {
            lancer une nouvelle FS.ErrnoError(60);
          }
          var octetsLire = 0;
          pour (var i = 0; i < longueur; i++) {
            var résultat;
            essayer {
              résultat = stream.tty.ops.get_char(stream.tty);
            } attraper (e) {
              lancer une nouvelle FS.ErrnoError(29);
            }
            si (résultat === indéfini && octetsLire === 0) {
              lancer une nouvelle FS.ErrnoError(6);
            }
            si (résultat === null || résultat === indéfini) break;
            octetsLire++;
            buffer[offset+i] = résultat ;
          }
          si (octets lus) {
            stream.node.timestamp = Date.maintenant();
          }
          retourner bytesRead;
        },write:function(flux, tampon, décalage, longueur, position) {
          si (!stream.tty || !stream.tty.ops.put_char) {
            lancer une nouvelle FS.ErrnoError(60);
          }
          essayer {
            pour (var i = 0; i < longueur; i++) {
              stream.tty.ops.put_char(stream.tty, tampon[offset+i]);
            }
          } attraper (e) {
            lancer une nouvelle FS.ErrnoError(29);
          }
          si (longueur) {
            stream.node.timestamp = Date.maintenant();
          }
          je reviens;
        }},default_tty_ops:{get_char:function(tty) {
          si (!tty.input.length) {
            var résultat = null;
            si (ENVIRONNEMENT_EST_NOEUD) {
              // nous lirons les données par morceaux de BUFSIZE
              var BUFSIZE = 256;
              var buf = Buffer.alloc(BUFSIZE);
              var octetsLire = 0;
  
              essayer {
                bytesRead = fs.readSync(processus.stdin.fd, buf, 0, BUFSIZE, -1);
              } attraper(e) {
                // Différences multiplateformes : sous Windows, la lecture EOF génère une exception, mais sur d'autres systèmes d'exploitation,
                // la lecture EOF renvoie 0. Uniformisez le comportement en traitant l'exception EOF comme renvoyant 0.
                si (e.toString().includes('EOF')) octetsLus = 0;
                sinon, jette e;
              }
  
              si (octets lus > 0) {
                result = buf.slice(0, bytesRead).toString('utf-8');
              } autre {
                résultat = nul;
              }
            } autre
            si (typeof fenêtre != 'undefined' &&
              typeof window.prompt == 'fonction') {
              // Navigateur.
              result = window.prompt('Input: '); // renvoie null en cas d'annulation
              si (résultat !== null) {
                résultat += '\n';
              }
            } sinon si (typeof readline == 'fonction') {
              // Ligne de commande.
              résultat = readline();
              si (résultat !== null) {
                résultat += '\n';
              }
            }
            si (!résultat) {
              retourner null;
            }
            tty.input = intArrayFromString(résultat, true);
          }
          retourner tty.input.shift();
        },put_char:function(tty, val) {
          si (val === nul || val === 10) {
            sortie(UTF8ArrayToString(tty.output, 0));
            tty.sortie = [];
          } autre {
            si (val != 0) tty.output.push(val); // val == 0 couperait la sortie de texte au milieu.
          }
        },flush:fonction(tty) {
          si (tty.output && tty.output.length > 0) {
            sortie(UTF8ArrayToString(tty.output, 0));
            tty.sortie = [];
          }
        }},default_tty1_ops : {put_char : function(tty, val) {
          si (val === nul || val === 10) {
            err(UTF8ArrayToString(tty.sortie, 0));
            tty.sortie = [];
          } autre {
            si (val != 0) tty.output.push(val);
          }
        },flush:fonction(tty) {
          si (tty.output && tty.output.length > 0) {
            err(UTF8ArrayToString(tty.sortie, 0));
            tty.sortie = [];
          }
        }}};
  
  fonction zeroMemory(adresse, taille) {
      HEAPU8.fill(0, adresse, adresse + taille);
    }
  
  fonction alignMemory(taille, alignement) {
      assert(alignment, "l'argument d'alignement est requis");
      renvoie Math.ceil(taille / alignement) * alignement ;
    }
  fonction mmapAlloc(taille) {
      taille = alignMemory(taille, 65536);
      var ptr = _emscripten_builtin_memalign(65536, taille);
      si (!ptr) renvoie 0 ;
      zeroMemory(ptr, taille);
      retourner ptr;
    }
  var MEMFS = {ops_table:null,mount:function(mount) {
        renvoyer MEMFS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createNode:function(parent, nom, mode, dev) {
        si (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // non pris en charge
          lancer une nouvelle FS.ErrnoError(63);
        }
        si (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              nœud : {
                getattr : MEMFS.node_ops.getattr,
                setattr : MEMFS.node_ops.setattr,
                recherche : MEMFS.node_ops.lookup,
                mknod : MEMFS.node_ops.mknod,
                renommer : MEMFS.node_ops.rename,
                dissocier : MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                lien symbolique : MEMFS.node_ops.symlink
              },
              flux: {
                llseek : MEMFS.stream_ops.llseek
              }
            },
            déposer: {
              nœud : {
                getattr : MEMFS.node_ops.getattr,
                setattr : MEMFS.node_ops.setattr
              },
              flux: {
                llseek : MEMFS.stream_ops.llseek,
                lire : MEMFS.stream_ops.read,
                écrivez : MEMFS.stream_ops.write,
                allouer : MEMFS.stream_ops.allocate,
                mmap : MEMFS.stream_ops.mmap,
                msync : MEMFS.stream_ops.msync
              }
            },
            lien: {
              nœud : {
                getattr : MEMFS.node_ops.getattr,
                setattr : MEMFS.node_ops.setattr,
                lien de lecture : MEMFS.node_ops.readlink
              },
              flux: {}
            },
            chrdev: {
              nœud : {
                getattr : MEMFS.node_ops.getattr,
                setattr : MEMFS.node_ops.setattr
              },
              flux : FS.chrdev_stream_ops
            }
          };
        }
        var node = FS.createNode(parent, nom, mode, dev);
        si (FS.isDir(node.mode)) {
          nœud.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          nœud.contenu = {};
        } sinon si (FS.isFile(node.mode)) {
          nœud.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.usedBytes = 0; // Le nombre réel d'octets utilisés dans le tableau typé, par opposition à contents.length qui donne la capacité totale.
          // Lorsque les données d'octets du fichier sont renseignées, cela pointera soit vers un tableau typé, soit vers un tableau JS normal. Les tableaux typés sont préférés
          // pour les performances, et utilisé par défaut. Cependant, les tableaux typés ne sont pas redimensionnables comme les tableaux JS normaux, il y a donc une petite taille de disque
          // pénalité impliquée pour l'ajout d'écritures de fichiers qui font croître continuellement un fichier similaire à std::vector capacity vs used -scheme.
          nœud.contenu = null;
        } sinon si (FS.isLink(node.mode)) {
          nœud.node_ops = MEMFS.ops_table.link.node;
          nœud.stream_ops = MEMFS.ops_table.link.stream;
        } sinon si (FS.isChrdev(node.mode)) {
          nœud.node_ops = MEMFS.ops_table.chrdev.node;
          nœud.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        nœud.horodatage = Date.maintenant();
        // ajouter le nouveau nœud au parent
        si (parent) {
          parent.contents[nom] = nœud;
          parent.timestamp = nœud.timestamp;
        }
        nœud de retour;
      },getFileDataAsTypedArray:fonction(nœud) {
        si (!node.contents) renvoie un nouveau Uint8Array(0);
        if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes); // Assurez-vous de ne pas renvoyer d'octets inutilisés en excès.
        renvoyer un nouveau Uint8Array(node.contents);
      },expandFileStorage:function(nœud, nouvelleCapacité) {
        var prevCapacity = node.contents ? node.contents.length : 0;
        si (prevCapacity >= newCapacity) return; // Pas besoin d'étendre, le stockage était déjà suffisamment grand.
        // Ne vous étendez pas strictement jusqu'à la limite demandée donnée s'il ne s'agit que d'une très petite augmentation, mais augmentez plutôt géométriquement la capacité.
        // Pour les fichiers de petite taille (< 1 Mo), effectuez une augmentation géométrique de la taille * 2, mais pour les fichiers de grande taille, effectuez une augmentation de la taille * 1,125 beaucoup plus conservatrice pour
        // éviter de dépasser le plafond d'allocation d'une marge très importante.
        var CAPACITE_DOUBLEMENT_MAX = 1024 * 1024;
        nouvelleCapacité = Math.max(nouvelleCapacité, (précédenteCapacité * (précédenteCapacité < CAPACITÉ_DOUBLING_MAX ? 2.0 : 1.125)) >>> 0);
        if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256); // Au minimum, allouez 256 b pour chaque fichier lors de l'extension.
        var oldContents = nœud.contenu;
        node.contents = new Uint8Array(newCapacity); // Allouer un nouveau stockage.
        if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0); // Copiez les anciennes données vers le nouveau stockage.
      },resizeFileStorage:function(nœud, nouvelle taille) {
        si (node.usedBytes == newSize) retour ;
        si (nouvelleTaille == 0) {
          node.contents = null; // Désengagement complet lors de la demande d'un redimensionnement à zéro.
          nœud.usedBytes = 0;
        } autre {
          var oldContents = nœud.contenu;
          node.contents = new Uint8Array(newSize); // Allouer un nouveau stockage.
          si (ancienContenu) {
            node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes))); // Copiez les anciennes données vers le nouveau stockage.
          }
          node.usedBytes = nouvelle taille ;
        }
      },node_ops:{getattr:function(nœud) {
          var attr = {};
          // les numéros de périphériques réutilisent les numéros d'inode.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = nœud.id;
          attr.mode = nœud.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = nœud.rdev;
          si (FS.isDir(node.mode)) {
            attr.taille = 4096;
          } sinon si (FS.isFile(node.mode)) {
            attr.size = nœud.usedBytes;
          } sinon si (FS.isLink(node.mode)) {
            attr.size = nœud.lien.longueur;
          } autre {
            attr.taille = 0;
          }
          attr.atime = nouvelle Date(nœud.horodatage);
          attr.mtime = nouvelle Date(nœud.horodatage);
          attr.ctime = nouvelle Date(nœud.horodatage);
          // REMARQUE : Dans notre implémentation, st_blocks = Math.ceil(st_size/st_blksize),
          // mais cela n'est pas requis par la norme.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          retourner attr;
        },setattr:function(nœud, attr) {
          si (attr.mode !== indéfini) {
            nœud.mode = attr.mode;
          }
          si (attr.timestamp !== indéfini) {
            nœud.horodatage = attr.horodatage;
          }
          si (attr.size !== indéfini) {
            MEMFS.resizeFileStorage(nœud, attr.size);
          }
        },recherche : fonction (parent, nom) {
          lancer FS.genericErrors[44];
        },mknod:function(parent, nom, mode, dev) {
          renvoie MEMFS.createNode(parent, nom, mode, dev);
        },renommer : fonction (ancien_nœud, nouveau_répertoire, nouveau_nom) {
          // si nous écrasons un répertoire à new_name, assurez-vous qu'il est vide.
          si (FS.isDir(old_node.mode)) {
            var nouveau_noeud;
            essayer {
              new_node = FS.lookupNode(nouveau_répertoire, nouveau_nom);
            } attraper (e) {
            }
            si (nouveau_noeud) {
              pour (var i dans new_node.contents) {
                lancer une nouvelle FS.ErrnoError(55);
              }
            }
          }
          // faire le recâblage interne
          supprimer old_node.parent.contents[old_node.name];
          old_node.parent.timestamp = Date.maintenant()
          ancien_noeud.nom = nouveau_nom;
          new_dir.contents[nouveau_nom] = ancien_noeud;
          nouveau_dir.horodatage = ancien_noeud.parent.horodatage;
          ancien_noeud.parent = nouveau_répertoire;
        },unlink:function(parent, nom) {
          supprimer parent.contents[nom];
          parent.timestamp = Date.maintenant();
        },rmdir:fonction(parent, nom) {
          var node = FS.lookupNode(parent, nom);
          pour (var i dans node.contents) {
            lancer une nouvelle FS.ErrnoError(55);
          }
          supprimer parent.contents[nom];
          parent.timestamp = Date.maintenant();
        },readdir:fonction(nœud) {
          var entrées = ['.', '..'];
          pour (var clé dans node.contents) {
            si (!node.contents.hasOwnProperty(clé)) {
              continuer;
            }
            entrées.push(clé);
          }
          retourner les entrées;
        },lien symbolique : fonction (parent, nouveau nom, ancien chemin) {
          var node = MEMFS.createNode(parent, nouveau nom, 511 /* 0777 */ | 40960, 0);
          nœud.link = ancien chemin;
          nœud de retour;
        },readlink:fonction(nœud) {
          si (!FS.isLink(node.mode)) {
            lancer une nouvelle FS.ErrnoError(28);
          }
          renvoyer le nœud.link ;
        }},stream_ops : {lecture : fonction (flux, tampon, décalage, longueur, position) {
          var contenu = stream.node.contents;
          si (position >= stream.node.usedBytes) renvoie 0 ;
          var taille = Math.min(stream.node.usedBytes - position, longueur);
          assert(taille >= 0);
          si (taille > 8 && contenu.sous-tableau) { // tableau non trivial et typé
            buffer.set(contenu.sous-tableau(position, position + taille), décalage);
          } autre {
            pour (var i = 0; i < taille; i++) tampon[décalage + i] = contenu[position + i];
          }
          taille de retour;
        },write:function(flux, tampon, décalage, longueur, position, canOwn) {
          // Le tampon de données doit être une vue de tableau typée
          assert(!(instance de tampon de ArrayBuffer));
          // Si le tampon est situé dans la mémoire principale (HEAP), et si
          // la mémoire peut grandir, nous ne pouvons pas conserver les références de la
          // mémoire tampon, car ils peuvent être invalidés. Cela signifie que nous
          // il faut copier son contenu.
          si (buffer.buffer === HEAP8.buffer) {
            canOwn = faux;
          }
  
          si (!length) renvoie 0 ;
          var nœud = flux.nœud;
          nœud.horodatage = Date.maintenant();
  
          if (buffer.subarray && (!node.contents || node.contents.subarray)) { // Cette écriture provient d'un tableau typé vers un tableau typé ?
            si (peut posséder) {
              assert(position === 0, 'canOwn ne doit impliquer aucune position étrange à l'intérieur du fichier');
              nœud.contenu = tampon.sous-tableau(décalage, décalage + longueur);
              nœud.usedBytes = longueur;
              longueur de retour;
            } else if (node.usedBytes === 0 && position === 0) { // S'il s'agit d'une première écriture simple dans un fichier vide, effectuez une définition rapide car nous n'avons pas besoin de nous soucier des anciennes données.
              nœud.contenu = tampon.tranche(décalage, décalage + longueur);
              nœud.usedBytes = longueur;
              longueur de retour;
            } else if (position + length <= node.usedBytes) { // Écriture dans une sous-plage déjà allouée et utilisée du fichier ?
              nœud.contenu.set(buffer.sous-tableau(décalage, décalage + longueur), position);
              longueur de retour;
            }
          }
  
          // Ajout à un fichier existant et nous devons le réaffecter, ou les données source ne sont pas fournies sous forme de tableau typé.
          MEMFS.expandFileStorage(nœud, position+longueur);
          si (node.contents.subarray && buffer.subarray) {
            // Utiliser l'écriture de tableau typée qui est disponible.
            nœud.contenu.set(buffer.sous-tableau(décalage, décalage + longueur), position);
          } autre {
            pour (var i = 0; i < longueur; i++) {
             node.contents[position + i] = buffer[offset + i]; // Ou revenir à l'écriture manuelle si ce n'est pas le cas.
            }
          }
          nœud.usedBytes = Math.max(nœud.usedBytes, position + longueur);
          longueur de retour;
        },llseek:function(flux, décalage, d'où) {
          var position = décalage;
          si (d'où === 1) {
            position += flux.position;
          } else if (d'où === 2) {
            si (FS.isFile(stream.node.mode)) {
              position += stream.node.usedBytes;
            }
          }
          si (position < 0) {
            lancer une nouvelle FS.ErrnoError(28);
          }
          position de retour;
        },allocate:function(flux, décalage, longueur) {
          MEMFS.expandFileStorage(stream.node, décalage + longueur);
          stream.node.usedBytes = Math.max(stream.node.usedBytes, décalage + longueur);
        },mmap:function(flux, adresse, longueur, position, prot, indicateurs) {
          si (adresse !== 0) {
            // Nous ne prenons actuellement pas en charge les indications de localisation pour l'adresse du mappage
            lancer une nouvelle FS.ErrnoError(28);
          }
          si (!FS.isFile(stream.node.mode)) {
            lancer une nouvelle FS.ErrnoError(43);
          }
          var ptr;
          var alloué ;
          var contenu = stream.node.contents;
          // Ne faites une nouvelle copie que lorsque MAP_PRIVATE est spécifié.
          si (!(drapeaux & 2) && contenu.buffer === tampon) {
            // Nous ne pouvons pas émuler MAP_SHARED lorsque le fichier n'est pas sauvegardé par le tampon
            // nous effectuons le mappage vers (par exemple le tampon HEAP).
            alloué = faux;
            ptr = contenu.byteOffset;
          } autre {
            // Essayez d'éviter les tranches inutiles.
            si (position > 0 || position + longueur < contenu.length) {
              si (contenu.sous-tableau) {
                contenu = contenu.sous-tableau(position, position + longueur);
              } autre {
                contenu = Array.prototype.slice.call(contenu, position, position + longueur);
              }
            }
            alloué = vrai;
            ptr = mmapAlloc(longueur);
            si (!ptr) {
              lancer une nouvelle FS.ErrnoError(48);
            }
            HEAP8.set(contenu, ptr);
          }
          retour { ptr : ptr, alloué : alloué };
        },msync:function(flux, tampon, décalage, longueur, mmapFlags) {
          si (!FS.isFile(stream.node.mode)) {
            lancer une nouvelle FS.ErrnoError(43);
          }
          si (mmapFlags & 2) {
            // Les appels MAP_PRIVATE n'ont pas besoin d'être synchronisés avec le système de fichiers sous-jacent
            retourner 0;
          }
  
          var bytesWritten = MEMFS.stream_ops.write(flux, tampon, 0, longueur, décalage, faux);
          // devrions-nous vérifier si bytesWritten et length sont identiques ?
          retourner 0;
        }}};
  
  /** @param {boolean=} noRunDep */
  fonction asyncLoad(url, onload, onerror, noRunDep) {
      var dep = !noRunDep ? getUniqueRunDependency('al ' + url) : '';
      lireAsync(url, fonction(arrayBuffer) {
        assert(arrayBuffer, 'Le chargement du fichier de données "' + url + '" a échoué (pas de arrayBuffer).');
        onload(nouveau Uint8Array(arrayBuffer));
        si (dep) removeRunDependency(dep);
      }, fonction(événement) {
        si (en cas d'erreur) {
          en erreur();
        } autre {
          throw 'Le chargement du fichier de données "' + url + '" a échoué.';
        }
      });
      si (dep) addRunDependency(dep);
    }
  
  var ERRNO_MESSAGES = {0:"Succès",1:"Liste d'arguments trop longue",2:"Autorisation refusée",3:"Adresse déjà utilisée",4:"Adresse non disponible",5:"Famille d'adresses non prise en charge par la famille de protocoles",6:"Plus de processus",7:"Socket déjà connecté",8:"Mauvais numéro de fichier",9:"Tentative de lecture d'un message illisible",10:"Périphérique de montage occupé",11:"Opération annulée",12:"Aucun enfant",13:"Connexion abandonnée",14:"Connexion refusée",15:"Connexion réinitialisée par l'homologue",16:"Erreur de blocage de verrouillage de fichier",17:"Adresse de destination requise",18:"Arg mathématique hors du domaine de la fonction",19:"Quota dépassé",20:"Le fichier existe",21:"Mauvaise adresse",22:"Fichier trop volumineux",23:"L'hôte est inaccessible",24:"Identifiant "supprimé", 25:"Séquence d'octets illégale", 26:"Connexion déjà en cours", 27:"Appel système interrompu", 28:"Argument non valide", 29:"Erreur d'E/S", 30:"Le socket est déjà connecté", 31:"Est un répertoire", 32:"Trop de liens symboliques", 33:"Trop de fichiers ouverts", 34:"Trop de liens", 35:"Message trop long", 36:"Tentative de saut multiple", 37:"Nom de fichier ou de chemin trop long", 38:"L'interface réseau n'est pas configurée", 39:"Connexion réinitialisée par le réseau", 40:"Le réseau est inaccessible", 41:"Trop de fichiers ouverts dans le système", 42:"Aucun espace tampon disponible", 43:"Aucun périphérique de ce type", 44:"Aucun fichier ou répertoire de ce type", 45:"Erreur de format d'exécution", 46:"Aucun verrou d'enregistrement disponible", 47:"Le lien a été rompu", 48:"Pas assez de cœur", 49:"Aucun message du message souhaité type",50:"Protocole non disponible",51:"Aucun espace disponible sur le périphérique",52:"Fonction non implémentée",53:"Le socket n'est pas connecté",54:"Ce n'est pas un répertoire",55:"Le répertoire n'est pas vide",56:"État non récupérable",57:"Opération de socket sur un non-socket",59:"Ce n'est pas une machine à écrire",60:"Aucun périphérique ou adresse de ce type",61:"Valeur trop grande pour le type de données défini",62:"L'ancien propriétaire est décédé",63:"Pas un super-utilisateur",64:"Tuyau cassé",65:"Erreur de protocole",66:"Protocole inconnu",67:"Type de protocole incorrect pour le socket",68:"Résultat mathématique non représentable",69:"Système de fichiers en lecture seule",70:"Recherche illégale",71:"Aucun processus de ce type",72:"Handle de fichier obsolète",73:"Délai de connexion expiré",74:"Fichier texte "occupé", 75 : "Lien entre appareils", 100 : "Appareil n'est pas un flux", 101 : "Mauvais fichier de police fmt", 102 : "Emplacement non valide", 103 : "Code de demande non valide", 104 : "Aucune anode", 105 : "Appareil de bloc requis", 106 :"Numéro de canal hors limites",107 : "Niveau 3 arrêté",108 : "Niveau 3 réinitialisé",109 : "Numéro de lien hors limites",110 : "Pilote de protocole non attaché",111 : "Aucune structure CSI disponible",112 : "Niveau 2 arrêté",113 : "Échange non valide",114 : "Descripteur de requête non valide",115 : "Échange complet",116 : "Aucune donnée (pour les E/S sans délai)",117 : "Temporisateur expiré",118 : "Ressources de flux manquantes",119 : "La machine n'est pas sur le réseau",120 : "Package non installé",121 : "L'objet est distant",122 : "Erreur d'annonce",123 : "Erreur de montage système",124 : "Erreur de communication lors de l'envoi",125 : "Point de montage croisé (pas vraiment d'erreur)",126 : "Le nom du journal donné n'est pas unique",127 : "fd "non valide pour cette opération",128:"Adresse distante modifiée",129:"Peut accéder à une bibliothèque partagée nécessaire",130:"Accès à une bibliothèque partagée corrompue",131:"Section .lib dans a.out corrompue",132:"Tentative de liaison dans trop de bibliothèques",133:"Tentative d'exécution d'une bibliothèque partagée",135:"Erreur de canal de flux",136:"Trop d'utilisateurs",137:"Type de socket non pris en charge",138:"Non pris en charge",139:"Famille de protocoles non prise en charge",140:"Impossible d'envoyer après l'arrêt du socket",141:"Trop de références",142:"L'hôte est en panne",148:"Aucun support (dans le lecteur de bande)",156:"Niveau 2 non synchronisé"};"Niveau 2 non synchronisé"};"Niveau 2 non synchronisé"};
  
  var ERRNO_CODES = {};
  var FS = {root:null,mounts:[],devices:{},streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:null,genericErrors:{},filesystems:null,syncFSRequests:0,lookupPath:(path, opts = {}) => {
        chemin = PATH_FS.resolve(FS.cwd(), chemin);
  
        si (!chemin) renvoie { chemin : '', nœud : null };
  
        var valeurs par défaut = {
          follow_mount: vrai,
          recurse_count: 0
        };
        opts = Objet.assign(valeurs par défaut, opts)
  
        si (opts.recurse_count > 8) { // recherche récursive maximale de 8
          lancer une nouvelle FS.ErrnoError(32);
        }
  
        // diviser le chemin
        var parts = PATH.normalizeArray(path.split('/').filter((p) => !!p), false);
  
        // commencer à la racine
        var courant = FS.root;
        var chemin_courant = '/';
  
        pour (var i = 0; i < parts.length; i++) {
          var islast = (i === parties.length-1);
          si (islast && opts.parent) {
            // arrêter de résoudre
            casser;
          }
  
          courant = FS.lookupNode(courant, pièces[i]);
          chemin_courant = CHEMIN.join2(chemin_courant, parties[i]);
  
          // sauter au nœud racine du montage s'il s'agit d'un point de montage
          si (FS.isMountpoint(courant)) {
            si (!islast || (islast && opts.follow_mount)) {
              courant = racine.montée.actuelle;
            }
          }
  
          // par défaut, lookupPath ne suivra pas un lien symbolique s'il s'agit du composant du chemin final.
          // le paramètre opts.follow = true remplacera ce comportement.
          si (!islast || opts.follow) {
            var nombre = 0;
            tandis que (FS.isLink(mode.courant)) {
              var lien = FS.readlink(chemin_courant);
              chemin_courant = PATH_FS.resolve(PATH.dirname(chemin_courant), lien);
  
              var lookup = FS.lookupPath(chemin_actuel, { nombre_récursif : opts.compte_récursif + 1 });
              courant = lookup.node;
  
              if (count++ > 40) { // limiter le nombre maximal de liens symboliques consécutifs à 40 (SYMLOOP_MAX).
                lancer une nouvelle FS.ErrnoError(32);
              }
            }
          }
        }
  
        retourner { chemin : chemin_courant, nœud : courant } ;
      },getPath:(nœud) => {
        var chemin;
        tandis que (vrai) {
          si (FS.isRoot(nœud)) {
            var mount = nœud.mount.point de montage;
            si (!path) renvoie mount;
            retourner mount[mount.length-1] !== '/' ? mount + '/' + chemin : mount + chemin ;
          }
          chemin = chemin ? nom.node + '/' + chemin : nom.node ;
          nœud = nœud.parent;
        }
      },hashName:(parentid, nom) => {
        var hachage = 0;
  
        pour (var i = 0; i < nom.length; i++) {
          hachage = ((hachage << 5) - hachage + nom.charCodeAt(i)) | 0;
        }
        retourner ((parentid + hachage) >>> 0) % FS.nameTable.length;
      },hashAddNode:(nœud) => {
        var hash = FS.hashName(nœud.parent.id, nœud.name);
        nœud.name_next = FS.nameTable[hachage];
        FS.nameTable[hash] = nœud;
      },hashRemoveNode:(nœud) => {
        var hash = FS.hashName(nœud.parent.id, nœud.name);
        si (FS.nameTable[hash] === nœud) {
          FS.nameTable[hash] = nœud.name_next;
        } autre {
          var courant = FS.nameTable[hash];
          pendant que (actuel) {
            si (current.name_next === nœud) {
              nom.courant_suivant = nœud.nom_suivant;
              casser;
            }
            courant = courant.nom_suivant;
          }
        }
      },lookupNode:(parent, nom) => {
        var errCode = FS.mayLookup(parent);
        si (errCode) {
          lancer une nouvelle FS.ErrnoError(errCode, parent);
        }
        var hash = FS.hashName(parent.id, nom);
        pour (var nœud = FS.nameTable[hash]; nœud; nœud = nœud.name_next) {
          var nodeName = nœud.nom;
          si (node.parent.id === parent.id && nodeName === nom) {
            nœud de retour;
          }
        }
        // si nous ne parvenons pas à le trouver dans le cache, appelez le VFS
        renvoie FS.lookup(parent, nom);
      },createNode:(parent, nom, mode, rdev) => {
        assert(typeof parent == 'objet')
        var node = new FS.FSNode(parent, nom, mode, rdev);
  
        FS.hashAddNode(nœud);
  
        nœud de retour;
      },détruireNode:(nœud) => {
        FS.hashRemoveNode(nœud);
      },isRoot:(nœud) => {
        retourner le nœud === node.parent;
      },isMountpoint:(nœud) => {
        retourner !!node.mounted;
      },isFile:(mode) => {
        retour (mode & 61440) === 32768;
      },isDir:(mode) => {
        retour (mode & 61440) === 16384;
      },isLink:(mode) => {
        retour (mode & 61440) === 40960;
      },isChrdev:(mode) => {
        retour (mode & 61440) === 8192;
      },isBlkdev:(mode) => {
        retour (mode & 61440) === 24576;
      },isFIFO:(mode) => {
        retour (mode & 61440) === 4096;
      },isSocket:(mode) => {
        retour (mode & 49152) === 49152;
      },flagModes:{"r":0,"r+":2,"w":577,"w+":578,"a":1089,"a+":1090},modeStringToFlags:(str) => {
        var drapeaux = FS.flagModes[str];
        si (typeof drapeaux == 'undefined') {
          throw new Error('Mode d'ouverture de fichier inconnu : ' + str);
        }
        drapeaux de retour;
      },flagsToPermissionString:(drapeau) => {
        var perms = ['r', 'w', 'rw'][drapeau & 3];
        si ((drapeau & 512)) {
          permanentes += 'w';
        }
        retour permanent;
      },nodePermissions:(nœud, permissions) => {
        si (FS.ignorePermissions) {
          retourner 0;
        }
        // renvoie 0 si des bits d'utilisateur, de groupe ou de propriétaire sont définis.
        si (perms.includes('r') && !(node.mode & 292)) {
          retour 2;
        } sinon si (perms.includes('w') && !(node.mode & 146)) {
          retour 2;
        } sinon si (perms.includes('x') && !(node.mode & 73)) {
          retour 2;
        }
        retourner 0;
      },mayLookup:(dir) => {
        var errCode = FS.nodePermissions(dir, 'x');
        si (errCode) renvoie errCode ;
        si (!dir.node_ops.lookup) renvoie 2 ;
        retourner 0;
      },mayCreate:(dir, nom) => {
        essayer {
          var node = FS.lookupNode(dir, nom);
          retour 20;
        } attraper (e) {
        }
        renvoie FS.nodePermissions(dir, 'wx');
      },mayDelete:(dir, nom, isdir) => {
        var nœud;
        essayer {
          nœud = FS.lookupNode(dir, nom);
        } attraper (e) {
          retourner e.errno;
        }
        var errCode = FS.nodePermissions(dir, 'wx');
        si (errCode) {
          retourner le code d'erreur ;
        }
        si (isdir) {
          si (!FS.isDir(node.mode)) {
            retour 54;
          }
          si (FS.isRoot(nœud) || FS.getPath(nœud) === FS.cwd()) {
            retour 10;
          }
        } autre {
          si (FS.isDir(node.mode)) {
            retour 31;
          }
        }
        retourner 0;
      },mayOpen:(nœud, drapeaux) => {
        si (!nœud) {
          retour 44;
        }
        si (FS.isLink(node.mode)) {
          retour 32;
        } sinon si (FS.isDir(node.mode)) {
          si (FS.flagsToPermissionString(flags) !== 'r' || // ouverture pour écriture
              (flags & 512)) { // TODO : vérifier O_SEARCH ? (== rechercher uniquement dans le répertoire)
            retour 31;
          }
        }
        renvoyer FS.nodePermissions(nœud, FS.flagsToPermissionString(drapeaux));
      },MAX_OPEN_FDS:4096,nextfd:(fd_start = 0, fd_end = FS.MAX_OPEN_FDS) => {
        pour (var fd = fd_start; fd <= fd_end; fd++) {
          si (!FS.streams[fd]) {
            retourner fd;
          }
        }
        lancer une nouvelle FS.ErrnoError(33);
      },getStream:(fd) => FS.streams[fd],createStream:(stream, fd_start, fd_end) => {
        si (!FS.FSStream) {
          FS.FSStream = /** @constructeur */ fonction(){};
          FS.FSStream.prototype = {
            objet: {
              obtenir : fonction() { renvoyer ceci.node; },
              ensemble : fonction(val) { this.node = val; }
            },
            est lu : {
              obtenir : fonction() { retourner (this.flags & 2097155) !== 1; }
            },
            estÉcrire : {
              obtenir : fonction() { retourner (this.flags & 2097155) !== 0; }
            },
            isAppend : {
              obtenir : fonction() { retourner (this.flags & 1024); }
            }
          };
        }
        // clonez-le, afin que nous puissions renvoyer une instance de FSStream
        flux = Objet.assign(nouveau FS.FSStream(), flux);
        var fd = FS.nextfd(fd_start, fd_end);
        flux.fd = fd;
        FS.streams[fd] = flux;
        flux de retour;
      },closeStream:(fd) => {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{ouvrir:(flux) => {
          var device = FS.getDevice(stream.node.rdev);
          // remplacer les opérations de flux du nœud par celles de l'appareil
          flux.stream_ops = périphérique.stream_ops;
          // transférer l'appel ouvert
          si (stream.stream_ops.open) {
            flux.stream_ops.open(flux);
          }
        },llseek:() => {
          lancer une nouvelle FS.ErrnoError(70);
        }},major:(dev) => ((dev) >> 8),mineur:(dev) => ((dev) & 0xff),makedev:(ma, mi) => ((ma) << 8 | (mi)),registerDevice:(dev, ops) => {
        FS.devices[dev] = { stream_ops: opérations };
      },getDevice:(dev) => FS.devices[dev],getMounts:(mount) => {
        var montages = [];
        var check = [montage];
  
        pendant que (vérifier.longueur) {
          var m = check.pop();
  
          supports.push(m);
  
          vérifier.push.apply(vérifier, m.mounts);
        }
  
        supports de retour;
      },syncfs:(remplir, rappeler) => {
        si (typeof populate == 'fonction') {
          rappel = remplir;
          peupler = faux;
        }
  
        FS.syncFSRequests++;
  
        si (FS.syncFSRequests > 1) {
          err('warning: ' + FS.syncFSRequests + ' Opérations FS.syncfs en cours de vol, probablement juste du travail supplémentaire');
        }
  
        var mounts = FS.getMounts(FS.root.mount);
        var terminé = 0;
  
        fonction doCallback(errCode) {
          assert(FS.syncFSRequests > 0);
          FS.syncFSRequests--;
          renvoyer le rappel (errCode);
        }
  
        fonction terminée(errCode) {
          si (errCode) {
            si (!fait.erroné) {
              fait.erroné = vrai;
              retourner doCallback(errCode);
            }
            retour;
          }
          si (++terminé >= mounts.length) {
            doCallback(null);
          }
        };
  
        // synchroniser tous les montages
        supports.forEach((montage) => {
          si (!mount.type.syncfs) {
            retourner fait(null);
          }
          mount.type.syncfs(monter, remplir, terminé);
        });
      },mount:(type, options, point de montage) => {
        si (typeof type == 'chaîne') {
          // Le système de fichiers n'a pas été inclus et à la place, nous avons une erreur
          // message stocké dans la variable.
          type de lancer;
        }
        var racine = point de montage === '/';
        var pseudo = !point de montage;
        var nœud;
  
        si (racine && FS.root) {
          lancer une nouvelle FS.ErrnoError(10);
        } sinon si (!racine && !pseudo) {
          var lookup = FS.lookupPath(point de montage, { follow_mount: false });
  
          mountpoint = lookup.path; // utiliser le chemin absolu
          nœud = recherche.nœud;
  
          si (FS.isMountpoint(nœud)) {
            lancer une nouvelle FS.ErrnoError(10);
          }
  
          si (!FS.isDir(node.mode)) {
            lancer une nouvelle FS.ErrnoError(54);
          }
        }
  
        var montage = {
          type: type,
          opte : opte,
          point de montage : point de montage,
          montures : []
        };
  
        // créer un nœud racine pour le système de fichiers
        var mountRoot = type.mount(montage);
        mountRoot.mount = montage;
        montage.root = mountRoot;
  
        si (racine) {
          FS.root = mountRoot;
        } sinon si (nœud) {
          // définir comme point de montage
          nœud.monté = montage ;
  
          // ajouter la nouvelle monture aux enfants de la monture actuelle
          si (nœud.montage) {
            nœud.mount.mounts.push(montage);
          }
        }
  
        retourner mountRoot;
      },démonter:(point de montage) => {
        var lookup = FS.lookupPath(point de montage, { follow_mount: false });
  
        si (!FS.isMountpoint(lookup.node)) {
          lancer une nouvelle FS.ErrnoError(28);
        }
  
        // détruire les nœuds de ce montage et tous ses montages enfants
        var nœud = lookup.nœud;
        var mount = nœud.monté;
        var mounts = FS.getMounts(montage);
  
        Objet.keys(FS.nameTable).forEach((hash) => {
          var courant = FS.nameTable[hash];
  
          pendant que (actuel) {
            var next = nom_suivant.actuel;
  
            si (montages.includes(montage.actuel)) {
              FS.destroyNode(courant);
            }
  
            actuel = suivant;
          }
        });
  
        // n'est plus un point de montage
        nœud.monté = null;
  
        // supprimer ce montage des montages enfants
        var idx = node.mount.mounts.indexOf(montage);
        assert(idx !== -1);
        nœud.mount.mounts.splice(idx, 1);
      },recherche :(parent, nom) => {
        renvoie parent.node_ops.lookup(parent, nom);
      },mknod:(chemin, mode, dev) => {
        var lookup = FS.lookupPath(chemin, { parent: true });
        var parent = lookup.node;
        var nom = PATH.basename(chemin);
        si (!nom || nom === '.' || nom === '..') {
          lancer une nouvelle FS.ErrnoError(28);
        }
        var errCode = FS.mayCreate(parent, nom);
        si (errCode) {
          lancer un nouveau FS.ErrnoError(errCode);
        }
        si (!parent.node_ops.mknod) {
          lancer une nouvelle FS.ErrnoError(63);
        }
        renvoyer parent.node_ops.mknod(parent, nom, mode, dev);
      },create:(chemin, mode) => {
        mode = mode !== indéfini ? mode : 438 /* 0666 */;
        mode &= 4095;
        mode |= 32768;
        renvoie FS.mknod(chemin, mode, 0);
      },mkdir:(chemin, mode) => {
        mode = mode !== indéfini ? mode : 511 /* 0777 */;
        mode &= 511 | 512;
        mode |= 16384;
        renvoie FS.mknod(chemin, mode, 0);
      },mkdirTree:(chemin, mode) => {
        var dirs = chemin.split('/');
        var d = '';
        pour (var i = 0; i < dirs.length; ++i) {
          si (!dirs[i]) continue ;
          d += '/' + dirs[i];
          essayer {
            FS.mkdir(d, mode);
          } attraper(e) {
            si (e.errno != 20) lancer e;
          }
        }
      },mkdev:(chemin, mode, développement) => {
        si (typeof dev == 'indéfini') {
          dev = mode;
          mode = 438 /* 0666 */;
        }
        mode |= 8192;
        renvoie FS.mknod(chemin, mode, dev);
      },lien symbolique : (ancien chemin, nouveau chemin) => {
        si (!PATH_FS.resolve(oldpath)) {
          lancer une nouvelle FS.ErrnoError(44);
        }
        var lookup = FS.lookupPath(nouveauchemin, { parent: true });
        var parent = lookup.node;
        si (!parent) {
          lancer une nouvelle FS.ErrnoError(44);
        }
        var nouveau nom = PATH.basename (nouveau chemin);
        var errCode = FS.mayCreate(parent, nouveaunom);
        si (errCode) {
          lancer un nouveau FS.ErrnoError(errCode);
        }
        si (!parent.node_ops.symlink) {
          lancer une nouvelle FS.ErrnoError(63);
        }
        renvoyer parent.node_ops.symlink(parent, nouveaunom, ancienchemin);
      },renommer :(ancien_chemin, nouveau_chemin) => {
        var old_dirname = CHEMIN.dirname(ancien_chemin);
        var new_dirname = PATH.dirname(nouveau_chemin);
        var ancien_nom = CHEMIN.basename(ancien_chemin);
        var nouveau_nom = CHEMIN.basename(nouveau_chemin);
        // les parents doivent exister
        var recherche, ancien_répertoire, nouveau_répertoire ;
  
        // laissez les erreurs provenant de répertoires inexistants remonter
        recherche = FS.lookupPath(ancien_chemin, { parent: true });
        old_dir = recherche.noeud;
        recherche = FS.lookupPath(nouveau_chemin, { parent: true });
        new_dir = recherche.noeud;
  
        si (!old_dir || !new_dir) lève une nouvelle FS.ErrnoError(44);
        // doivent faire partie du même support
        si (ancien_répertoire.mount !== nouveau_répertoire.mount) {
          lancer une nouvelle FS.ErrnoError(75);
        }
        // la source doit exister
        var old_node = FS.lookupNode(ancien_répertoire, ancien_nom);
        // l'ancien chemin ne doit pas être un ancêtre du nouveau chemin
        var relative = PATH_FS.relative(ancien_chemin, nouveau_nom_répertoire);
        si (relative.charAt(0) !== '.') {
          lancer une nouvelle FS.ErrnoError(28);
        }
        // le nouveau chemin ne doit pas être un ancêtre de l'ancien chemin
        relative = PATH_FS.relative(nouveau_chemin, ancien_nom_de_répertoire);
        si (relative.charAt(0) !== '.') {
          lancer une nouvelle FS.ErrnoError(55);
        }
        // voir si le nouveau chemin existe déjà
        var nouveau_noeud;
        essayer {
          new_node = FS.lookupNode(nouveau_répertoire, nouveau_nom);
        } attraper (e) {
          // pas fatal
        }
        // sortie anticipée si rien n'a besoin de changer
        si (ancien_nœud === nouveau_nœud) {
          retour;
        }
        // nous devrons supprimer l'ancienne entrée
        var isdir = FS.isDir(old_node.mode);
        var errCode = FS.mayDelete(old_dir, old_name, isdir);
        si (errCode) {
          lancer un nouveau FS.ErrnoError(errCode);
        }
        // nous avons besoin d'autorisations de suppression si nous devons écraser.
        // besoin de permissions de création si la nouvelle n'existe pas déjà.
        errCode = nouveau_noeud ?
          FS.mayDelete(nouveau_répertoire, nouveau_nom, isdir) :
          FS.mayCreate(nouveau_répertoire, nouveau_nom);
        si (errCode) {
          lancer un nouveau FS.ErrnoError(errCode);
        }
        si (!old_dir.node_ops.rename) {
          lancer une nouvelle FS.ErrnoError(63);
        }
        si (FS.isMountpoint(ancien_nœud) || (nouveau_nœud && FS.isMountpoint(nouveau_nœud))) {
          lancer une nouvelle FS.ErrnoError(10);
        }
        // si nous allons changer le parent, vérifiez les autorisations d'écriture
        si (nouveau_répertoire !== ancien_répertoire) {
          errCode = FS.nodePermissions(ancien_répertoire, 'w');
          si (errCode) {
            lancer un nouveau FS.ErrnoError(errCode);
          }
        }
        // supprimer le nœud du hachage de recherche
        FS.hashRemoveNode(ancien_nœud);
        // renommer le système de fichiers sous-jacent
        essayer {
          old_dir.node_ops.rename(ancien_nœud, nouveau_répertoire, nouveau_nom);
        } attraper (e) {
          jeter e;
        } enfin {
          // rajoutez le nœud au hachage (au cas où node_ops.rename
          // a changé de nom)
          FS.hashAddNode(ancien_nœud);
        }
      },rmdir:(chemin) => {
        var lookup = FS.lookupPath(chemin, { parent: true });
        var parent = lookup.node;
        var nom = PATH.basename(chemin);
        var node = FS.lookupNode(parent, nom);
        var errCode = FS.mayDelete(parent, nom, vrai);
        si (errCode) {
          lancer un nouveau FS.ErrnoError(errCode);
        }
        si (!parent.node_ops.rmdir) {
          lancer une nouvelle FS.ErrnoError(63);
        }
        si (FS.isMountpoint(nœud)) {
          lancer une nouvelle FS.ErrnoError(10);
        }
        parent.node_ops.rmdir(parent, nom);
        FS.destroyNode(nœud);
      },readdir:(chemin) => {
        var lookup = FS.lookupPath(chemin, { suivre : vrai });
        var nœud = lookup.nœud;
        si (!node.node_ops.readdir) {
          lancer une nouvelle FS.ErrnoError(54);
        }
        renvoyer node.node_ops.readdir(nœud);
      },unlink:(chemin) => {
        var lookup = FS.lookupPath(chemin, { parent: true });
        var parent = lookup.node;
        si (!parent) {
          lancer une nouvelle FS.ErrnoError(44);
        }
        var nom = PATH.basename(chemin);
        var node = FS.lookupNode(parent, nom);
        var errCode = FS.mayDelete(parent, nom, false);
        si (errCode) {
          // Selon POSIX, nous devrions mapper EISDIR à EPERM, mais
          // nous faisons plutôt ce que fait Linux (et nous devons, puisque nous utilisons
          // la bibliothèque musl linux libc).
          lancer un nouveau FS.ErrnoError(errCode);
        }
        si (!parent.node_ops.unlink) {
          lancer une nouvelle FS.ErrnoError(63);
        }
        si (FS.isMountpoint(nœud)) {
          lancer une nouvelle FS.ErrnoError(10);
        }
        parent.node_ops.unlink(parent, nom);
        FS.destroyNode(nœud);
      },readlink:(chemin) => {
        var lookup = FS.lookupPath(chemin);
        var lien = lookup.node;
        si (!lien) {
          lancer une nouvelle FS.ErrnoError(44);
        }
        si (!link.node_ops.readlink) {
          lancer une nouvelle FS.ErrnoError(28);
        }
        renvoie PATH_FS.resolve(FS.getPath(link.parent), link.node_ops.readlink(link));
      },stat:(chemin, dontFollow) => {
        var lookup = FS.lookupPath(chemin, { suivre : !dontFollow });
        var nœud = lookup.nœud;
        si (!nœud) {
          lancer une nouvelle FS.ErrnoError(44);
        }
        si (!node.node_ops.getattr) {
          lancer une nouvelle FS.ErrnoError(63);
        }
        renvoyer node.node_ops.getattr(nœud);
      },lstat:(chemin) => {
        renvoie FS.stat(chemin, vrai);
      },chmod:(chemin, mode, dontFollow) => {
        var nœud;
        si (typeof chemin == 'chaîne') {
          var lookup = FS.lookupPath(chemin, { suivre : !dontFollow });
          nœud = recherche.nœud;
        } autre {
          noeud = chemin;
        }
        si (!node.node_ops.setattr) {
          lancer une nouvelle FS.ErrnoError(63);
        }
        nœud.node_ops.setattr(nœud, {
          mode : (mode et 4095) | (node.mode et ~4095),
          horodatage : Date.now()
        });
      },lchmod:(chemin, mode) => {
        FS.chmod(chemin, mode, vrai);
      },fchmod:(fd, mode) => {
        var stream = FS.getStream(fd);
        si (!flux) {
          lancer une nouvelle FS.ErrnoError(8);
        }
        FS.chmod(flux.nœud, mode);
      },chown:(chemin, uid, gid, dontFollow) => {
        var nœud;
        si (typeof chemin == 'chaîne') {
          var lookup = FS.lookupPath(chemin, { suivre : !dontFollow });
          nœud = recherche.nœud;
        } autre {
          noeud = chemin;
        }
        si (!node.node_ops.setattr) {
          lancer une nouvelle FS.ErrnoError(63);
        }
        nœud.node_ops.setattr(nœud, {
          horodatage : Date.now()
          // nous ignorons l'uid/gid pour l'instant
        });
      },lchown:(chemin, uid, gid) => {
        FS.chown(chemin, uid, gid, true);
      },fchown:(fd, uid, gid) => {
        var stream = FS.getStream(fd);
        si (!flux) {
          lancer une nouvelle FS.ErrnoError(8);
        }
        FS.chown(flux.nœud, uid, gid);
      },truncate:(chemin, len) => {
        si (len < 0) {
          lancer une nouvelle FS.ErrnoError(28);
        }
        var nœud;
        si (typeof chemin == 'chaîne') {
          var lookup = FS.lookupPath(chemin, { suivre : vrai });
          nœud = recherche.nœud;
        } autre {
          noeud = chemin;
        }
        si (!node.node_ops.setattr) {
          lancer une nouvelle FS.ErrnoError(63);
        }
        si (FS.isDir(node.mode)) {
          lancer une nouvelle FS.ErrnoError(31);
        }
        si (!FS.isFile(node.mode)) {
          lancer une nouvelle FS.ErrnoError(28);
        }
        var errCode = FS.nodePermissions(node, 'w');
        si (errCode) {
          lancer un nouveau FS.ErrnoError(errCode);
        }
        nœud.node_ops.setattr(nœud, {
          taille: len,
          horodatage : Date.now()
        });
      },ftruncate:(fd, len) => {
        var stream = FS.getStream(fd);
        si (!flux) {
          lancer une nouvelle FS.ErrnoError(8);
        }
        si ((stream.flags & 2097155) === 0) {
          lancer une nouvelle FS.ErrnoError(28);
        }
        FS.truncate(flux.nœud, len);
      },utime:(chemin, atime, mtime) => {
        var lookup = FS.lookupPath(chemin, { suivre : vrai });
        var nœud = lookup.nœud;
        nœud.node_ops.setattr(nœud, {
          horodatage : Math.max(atime, mtime)
        });
      },open:(chemin, drapeaux, mode, fd_start, fd_end) => {
        si (chemin === "") {
          lancer une nouvelle FS.ErrnoError(44);
        }
        drapeaux = typeof drapeaux == 'chaîne' ? FS.modeStringToFlags(drapeaux) : drapeaux ;
        mode = typeof mode == 'non défini' ? 438 /* 0666 */ : mode;
        si ((drapeaux & 64)) {
          mode = (mode & 4095) | 32768;
        } autre {
          mode = 0;
        }
        var nœud;
        si (typeof chemin == 'objet') {
          noeud = chemin;
        } autre {
          chemin = CHEMIN.normalize(chemin);
          essayer {
            var recherche = FS.lookupPath(chemin, {
              suivre : !(drapeaux & 131072)
            });
            nœud = recherche.nœud;
          } attraper (e) {
            // ignorer
          }
        }
        // peut-être que nous devons créer le nœud
        var créé = faux;
        si ((drapeaux & 64)) {
          si (nœud) {
            // si O_CREAT et O_EXCL sont définis, une erreur est générée si le nœud existe déjà
            si ((drapeaux & 128)) {
              lancer une nouvelle FS.ErrnoError(20);
            }
          } autre {
            // le nœud n'existe pas, essayez de le créer
            nœud = FS.mknod(chemin, mode, 0);
            créé = vrai;
          }
        }
        si (!nœud) {
          lancer une nouvelle FS.ErrnoError(44);
        }
        // impossible de tronquer un périphérique
        si (FS.isChrdev(node.mode)) {
          drapeaux &= ~512;
        }
        // si on ne demande qu'un répertoire, alors celui-ci doit en être un
        si ((drapeaux & 65536) && !FS.isDir(node.mode)) {
          lancer une nouvelle FS.ErrnoError(54);
        }
        // vérifier les autorisations, s'il ne s'agit pas d'un fichier que nous venons de créer maintenant (il est possible de
        // créer et écrire dans un fichier avec des autorisations en lecture seule ; il est en lecture seule
        // pour une utilisation ultérieure)
        si (!créé) {
          var errCode = FS.mayOpen(node, flags);
          si (errCode) {
            lancer un nouveau FS.ErrnoError(errCode);
          }
        }
        // effectuer une troncature si nécessaire
        si ((drapeaux & 512)) {
          FS.truncate(nœud, 0);
        }
        // nous les avons déjà traités, ne les transmettez pas au système de fichiers virtuel sous-jacent
        drapeaux &= ~(128 | 512 | 131072);
  
        // enregistrer le flux avec le système de fichiers
        var stream = FS.createStream({
          nœud : nœud,
          chemin : FS.getPath(node), // nous voulons le chemin absolu vers le nœud
          drapeaux: drapeaux,
          recherchable : vrai,
          position: 0,
          stream_ops : nœud.stream_ops,
          // utilisé par les appels de famille de fichiers libc (fopen, fwrite, ferror, etc.)
          non obtenu : [],
          erreur : faux
        }, fd_start, fd_end);
        // appeler la fonction d'ouverture du nouveau flux
        si (stream.stream_ops.open) {
          flux.stream_ops.open(flux);
        }
        si (Module['logReadFiles'] && !(drapeaux & 1)) {
          si (!FS.readFiles) FS.readFiles = {};
          si (!(chemin dans FS.readFiles)) {
            FS.readFiles[chemin] = 1;
          }
        }
        flux de retour;
      },fermer:(flux) => {
        si (FS.isClosed(flux)) {
          lancer une nouvelle FS.ErrnoError(8);
        }
        si (stream.getdents) stream.getdents = null; // libérer l'état readdir
        essayer {
          si (stream.stream_ops.close) {
            flux.stream_ops.close(flux);
          }
        } attraper (e) {
          jeter e;
        } enfin {
          FS.closeStream(stream.fd);
        }
        flux.fd = null;
      },isClosed:(flux) => {
        renvoyer le flux.fd === null;
      },llseek:(flux, décalage, d'où) => {
        si (FS.isClosed(flux)) {
          lancer une nouvelle FS.ErrnoError(8);
        }
        si (!stream.seekable || !stream.stream_ops.llseek) {
          lancer une nouvelle FS.ErrnoError(70);
        }
        si (d'où != 0 && d'où != 1 && d'où != 2) {
          lancer une nouvelle FS.ErrnoError(28);
        }
        stream.position = stream.stream_ops.llseek(flux, décalage, d'où);
        flux.ungotten = [];
        flux de retour.position;
      },read:(flux, tampon, décalage, longueur, position) => {
        si (longueur < 0 || position < 0) {
          lancer une nouvelle FS.ErrnoError(28);
        }
        si (FS.isClosed(flux)) {
          lancer une nouvelle FS.ErrnoError(8);
        }
        si ((stream.flags & 2097155) === 1) {
          lancer une nouvelle FS.ErrnoError(8);
        }
        si (FS.isDir(stream.node.mode)) {
          lancer une nouvelle FS.ErrnoError(31);
        }
        si (!stream.stream_ops.read) {
          lancer une nouvelle FS.ErrnoError(28);
        }
        var seeking = typeof position != 'undefined';
        si (!cherchant) {
          position = flux.position;
        } sinon si (!stream.seekable) {
          lancer une nouvelle FS.ErrnoError(70);
        }
        var bytesRead = stream.stream_ops.read(flux, tampon, décalage, longueur, position);
        si (!recherche) stream.position += bytesRead;
        retourner bytesRead;
      },write:(flux, tampon, décalage, longueur, position, canOwn) => {
        si (longueur < 0 || position < 0) {
          lancer une nouvelle FS.ErrnoError(28);
        }
        si (FS.isClosed(flux)) {
          lancer une nouvelle FS.ErrnoError(8);
        }
        si ((stream.flags & 2097155) === 0) {
          lancer une nouvelle FS.ErrnoError(8);
        }
        si (FS.isDir(stream.node.mode)) {
          lancer une nouvelle FS.ErrnoError(31);
        }
        si (!stream.stream_ops.write) {
          lancer une nouvelle FS.ErrnoError(28);
        }
        si (stream.seekable && stream.flags & 1024) {
          // rechercher jusqu'à la fin avant d'écrire en mode ajout
          FS.llseek(flux, 0, 2);
        }
        var seeking = typeof position != 'undefined';
        si (!cherchant) {
          position = flux.position;
        } sinon si (!stream.seekable) {
          lancer une nouvelle FS.ErrnoError(70);
        }
        var bytesWritten = stream.strea m_ops.write(flux, tampon, décalage, longueur, position, canOwn);
        si (!recherche) stream.position += bytesWritten;
        retourner les octets écrits ;
      },allocate:(flux, décalage, longueur) => {
        si (FS.isClosed(flux)) {
          lancer une nouvelle FS.ErrnoError(8);
        }
        si (décalage < 0 || longueur <= 0) {
          lancer une nouvelle FS.ErrnoError(28);
        }
        si ((stream.flags & 2097155) === 0) {
          lancer une nouvelle FS.ErrnoError(8);
        }
        si (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
          lancer une nouvelle FS.ErrnoError(43);
        }
        si (!stream.stream_ops.allocate) {
          lancer une nouvelle FS.ErrnoError(138);
        }
        stream.stream_ops.allocate(flux, décalage, longueur);
      },mmap:(flux, adresse, longueur, position, prot, drapeaux) => {
        // L'utilisateur demande l'écriture dans le fichier (prot & PROT_WRITE != 0).
        // Vérification si nous avons les autorisations d'écrire dans le fichier, sauf si
        // L'indicateur MAP_PRIVATE est défini. Selon la spécification POSIX, il est possible
        // pour écrire dans un fichier ouvert en mode lecture seule avec l'indicateur MAP_PRIVATE,
        // car toutes les modifications ne seront visibles que dans la mémoire de
        // le processus actuel.
        si ((prot & 2) !== 0
            && (drapeaux & 2) === 0
            && (stream.flags & 2097155) !== 2) {
          lancer une nouvelle FS.ErrnoError(2);
        }
        si ((stream.flags & 2097155) === 1) {
          lancer une nouvelle FS.ErrnoError(2);
        }
        si (!stream.stream_ops.mmap) {
          lancer une nouvelle FS.ErrnoError(43);
        }
        renvoie stream.stream_ops.mmap(flux, adresse, longueur, position, prot, flags);
      },msync:(flux, tampon, décalage, longueur, mmapFlags) => {
        si (!flux || !flux.stream_ops.msync) {
          retourner 0;
        }
        renvoyer stream.stream_ops.msync(flux, tampon, décalage, longueur, mmapFlags);
      },munmap:(flux) => 0,ioctl:(flux, cmd, arg) => {
        si (!stream.stream_ops.ioctl) {
          lancer une nouvelle FS.ErrnoError(59);
        }
        renvoyer stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:(chemin, opts = {}) => {
        opts.flags = opts.flags || 0;
        opts.encoding = opts.encoding || 'binaire';
        si (opts.encoding !== 'utf8' && opts.encoding !== 'binaire') {
          throw new Error('Type d'encodage non valide "' + opts.encoding + '"');
        }
        var ret;
        var stream = FS.open(chemin, opts.flags);
        var stat = FS.stat(chemin);
        var longueur = stat.size;
        var buf = new Uint8Array(longueur);
        FS.read(flux, buf, 0, longueur, 0);
        si (opts.encoding === 'utf8') {
          ret = UTF8ArrayToString(buf, 0);
        } sinon si (opts.encoding === 'binaire') {
          ret = tampon;
        }
        FS.close(flux);
        retour ret;
      },writeFile:(chemin, données, options = {}) => {
        opts.flags = opts.flags || 577;
        var stream = FS.open(chemin, opts.flags, opts.mode);
        si (typeof données == 'chaîne') {
          var buf = new Uint8Array(lengthBytesUTF8(data)+1);
          var actualNumBytes = stringToUTF8Array(données, buf, 0, buf.length);
          FS.write(flux, buf, 0, actualNumBytes, indéfini, opts.canOwn);
        } sinon si (ArrayBuffer.isView(données)) {
          FS.write(flux, données, 0, données.byteLength, indéfini, opts.canOwn);
        } autre {
          lancer une nouvelle erreur ('Type de données non pris en charge');
        }
        FS.close(flux);
      },cwd:() => FS.currentPath,chdir:(chemin) => {
        var lookup = FS.lookupPath(chemin, { suivre : vrai });
        si (lookup.node === null) {
          lancer une nouvelle FS.ErrnoError(44);
        }
        si (!FS.isDir(lookup.node.mode)) {
          lancer une nouvelle FS.ErrnoError(54);
        }
        var errCode = FS.nodePermissions(lookup.node, 'x');
        si (errCode) {
          lancer un nouveau FS.ErrnoError(errCode);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:() => {
        FS.mkdir('/tmp');
        FS.mkdir('/accueil');
        FS.mkdir('/home/utilisateur_web');
      },createDefaultDevices:() => {
        // créer /dev
        FS.mkdir('/dev');
        // configuration /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          lire : () => 0,
          écrire : (flux, tampon, décalage, longueur, pos) => longueur,
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // configurer /dev/tty et /dev/tty1
        // stderr doit imprimer la sortie en utilisant err() plutôt que out()
        // nous enregistrons donc un deuxième tty juste pour cela.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // configuration /dev/[u]aléatoire
        var random_device = getRandomDevice();
        FS.createDevice('/dev', 'aléatoire', random_device);
        FS.createDevice('/dev', 'urandom', random_device);
        // nous n'allons pas émuler le périphérique shm réel,
        // créez simplement les répertoires tmp qui y résident généralement
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createSpecialDirectories:() => {
        // crée /proc/self/fd qui autorise /proc/self/fd/6 => readlink donne le
        // nom du flux pour fd 6 (voir test_unistd_ttyname)
        FS.mkdir('/proc');
        var proc_self = FS.mkdir('/proc/self');
        FS.mkdir('/proc/self/fd');
        FS.montage({
          montage : () => {
            var node = FS.createNode(proc_self, 'fd', 16384 | 511 /* 0777 */, 73);
            nœud.node_ops = {
              recherche : (parent, nom) => {
                var fd = +nom;
                var stream = FS.getStream(fd);
                si (!stream) lance une nouvelle FS.ErrnoError(8);
                var ret = {
                  parent: nul,
                  montage : { point de montage : 'faux' },
                  node_ops : { readlink : () => stream.path },
                };
                ret.parent = ret; // le faire ressembler à un simple nœud racine
                retour ret;
              }
            };
            nœud de retour;
          }
        }, {}, '/proc/self/fd');
      },createStandardStreams:() => {
        // TODO désapprouve l'ancienne fonctionnalité d'un seul
        // rappel d'entrée/sortie et qui utilise FS.createDevice
        // et nécessite plutôt un ensemble unique d'opérations de flux
  
        // par défaut, nous créons un lien symbolique entre les flux standards et le
        // périphériques tty par défaut. Cependant, si les flux standard
        // ont été écrasés, nous créons un périphérique unique pour
        // eux à la place.
        si (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } autre {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        si (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } autre {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        si (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } autre {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // ouvrir les flux par défaut pour les périphériques stdin, stdout et stderr
        var stdin = FS.open('/dev/stdin', 0);
        var stdout = FS.open('/dev/stdout', 1);
        var stderr = FS.open('/dev/stderr', 1);
        assert(stdin.fd === 0, 'handle invalide pour stdin (' + stdin.fd + ')');
        assert(stdout.fd === 1, 'handle non valide pour stdout (' + stdout.fd + ')');
        assert(stderr.fd === 2, 'handle invalide pour stderr (' + stderr.fd + ')');
      },assureErrnoError:() => {
        si (FS.ErrnoError) retourne ;
        FS.ErrnoError = /** @this{Object} */ fonction ErrnoError(errno, nœud) {
          this.node = nœud;
          ceci.setErrno = /** @this{Objet} */ function(errno) {
            ceci.errno = errno;
            pour (var clé dans ERRNO_CODES) {
              si (ERRNO_CODES[clé] === errno) {
                ce.code = clé;
                casser;
              }
            }
          };
          ceci.setErrno(errno);
          ce.message = ERRNO_MESSAGES[errno];
  
          // Essayez d'obtenir une trace de pile aussi utile que possible. Sur Node.js, obtenir Error.stack
          // garantit maintenant qu'il montre ce que nous voulons.
          si (cette.pile) {
            // Définissez la propriété stack pour Node.js 4, sinon vous obtiendrez une erreur sur la ligne suivante.
            Object.defineProperty(this, "stack", { valeur : (nouvelle erreur).stack, accessible en écriture : true });
            ceci.pile = demangleAll(ceci.pile);
          }
        };
        FS.ErrnoError.prototype = nouvelle erreur();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Certaines erreurs peuvent se produire assez souvent, pour éviter les frais généraux, nous les réutilisons (et souffrons d'un manque d'informations sur la pile)
        [44].forEach((code) => {
          FS.genericErrors[code] = nouveau FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<erreur générique, pas de pile>';
        });
      },staticInit:() => {
        FS.ensureErrnoError();
  
        FS.nameTable = nouveau tableau(4096);
  
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
  
        FS.systèmes de fichiers = {
          « MEMFS » : MEMFS,
        };
      },init:(entrée, sortie, erreur) => {
        assert(!FS.init.initialized, 'FS.init a été appelé précédemment. Si vous souhaitez initialiser ultérieurement avec des paramètres personnalisés, supprimez tous les appels antérieurs (notez qu'un appel est automatiquement ajouté au code généré)');
        FS.init.initialisé = vrai;
  
        FS.ensureErrnoError();
  
        // Autoriser Module.stdin etc. à fournir des valeurs par défaut, si aucune ne nous est explicitement transmise ici
        Module['stdin'] = entrée || Module['stdin'];
        Module['stdout'] = sortie || Module['stdout'];
        Module['stderr'] = erreur || Module['stderr'];
  
        FS.createStandardStreams();
      },quitter:() => {
        FS.init.initialized = faux;
        // Appelez la fonction interne de musl pour fermer tous les flux stdio, donc rien n'est
        // laissé dans les tampons internes.
        ___stdio_exit();
        // fermer tous nos flux
        pour (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          si (!flux) {
            continuer;
          }
          FS.close(flux);
        }
      },getMode:(canRead, canWrite) => {
        var mode = 0;
        si (canRead) mode |= 292 | 73;
        si (canWrite) mode |= 146;
        mode de retour;
      },findObject:(chemin, dontResolveLastLink) => {
        var ret = FS.analyzePath(chemin, dontResolveLastLink);
        si (ret.existe) {
          retourner ret.object;
        } autre {
          retourner null;
        }
      },analyzePath:(chemin, dontResolveLastLink) => {
        // opérer à partir du contexte de la cible du lien symbolique
        essayer {
          var lookup = FS.lookupPath(chemin, { suivre : !dontResolveLastLink });
          chemin = lookup.path;
        } attraper (e) {
        }
        var ret = {
          isRoot : false, exists : false, erreur : 0, nom : null, chemin : null, objet : null,
          parentExists : faux, parentPath : null, parentObject : null
        };
        essayer {
          var lookup = FS.lookupPath(chemin, { parent: true });
          ret.parentExists = vrai;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = CHEMIN.basename(chemin);
          lookup = FS.lookupPath(chemin, { suivre : !dontResolveLastLink });
          ret.existe = vrai;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } attraper (e) {
          ret.erreur = e.errno;
        };
        retour ret;
      },createPath:(parent, chemin, canRead, canWrite) => {
        parent = typeof parent == 'chaîne' ? parent : FS.getPath(parent);
        var parties = chemin.split('/').reverse();
        tandis que (parties.longueur) {
          var partie = pièces.pop();
          si (!part) continue ;
          var courant = CHEMIN.join2(parent, partie);
          essayer {
            FS.mkdir(actuel);
          } attraper (e) {
            // ignorer EEXIST
          }
          parent = actuel;
        }
        courant de retour;
      },createFile:(parent, nom, propriétés, canRead, canWrite) => {
        var path = PATH.join2(typeof parent == 'string' ? parent : FS.getPath(parent), nom);
        var mode = FS.getMode(canRead, canWrite);
        renvoie FS.create(chemin, mode);
      },createDataFile:(parent, nom, données, peut lire, peut écrire, peut posséder) => {
        var chemin = nom;
        si (parent) {
          parent = typeof parent == 'chaîne' ? parent : FS.getPath(parent);
          chemin = nom ? PATH.join2(parent, nom) : parent;
        }
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(chemin, mode);
        si (données) {
          si (typeof données == 'chaîne') {
            var arr = new Array(données.longueur);
            pour (var i = 0, len = données.length; i < len; ++i) arr[i] = données.charCodeAt(i);
            données = arr;
          }
          // assurez-vous que nous pouvons écrire dans le fichier
          FS.chmod(nœud, mode | 146);
          var stream = FS.open(noeud, 577);
          FS.write(flux, données, 0, données.length, 0, canOwn);
          FS.close(flux);
          FS.chmod(nœud, mode);
        }
        nœud de retour;
      },createDevice:(parent, nom, entrée, sortie) => {
        var path = PATH.join2(typeof parent == 'string' ? parent : FS.getPath(parent), nom);
        var mode = FS.getMode(!!entrée, !!sortie);
        si (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Créer un faux appareil qu'un ensemble d'opérations de flux doit émuler
        // l'ancien comportement.
        FS.registerDevice(dev, {
          ouvert : (flux) => {
            flux.seekable = faux;
          },
          fermer : (flux) => {
            // vider toutes les données de ligne en attente
            si (sortie && sortie.buffer && sortie.buffer.length) {
              sortie(10);
            }
          },
          lire : (flux, tampon, décalage, longueur, pos /* ignoré */) => {
            var octetsLire = 0;
            pour (var i = 0; i < longueur; i++) {
              var résultat;
              essayer {
                résultat = entrée();
              } attraper (e) {
                lancer une nouvelle FS.ErrnoError(29);
              }
              si (résultat === indéfini && octetsLire === 0) {
                lancer une nouvelle FS.ErrnoError(6);
              }
              si (résultat === null || résultat === indéfini) break;
              octetsLire++;
              buffer[offset+i] = résultat ;
            }
            si (octets lus) {
              stream.node.timestamp = Date.maintenant();
            }
            retourner bytesRead;
          },
          écrire : (flux, tampon, décalage, longueur, position) => {
            pour (var i = 0; i < longueur; i++) {
              essayer {
                sortie(tampon[offset+i]);
              } attraper (e) {
                lancer une nouvelle FS.ErrnoError(29);
              }
            }
            si (longueur) {
              stream.node.timestamp = Date.maintenant();
            }
            je reviens;
          }
        });
        renvoie FS.mkdev(chemin, mode, dev);
      },forceLoadFile:(obj) => {
        si (obj.isDevice || obj.isFolder || obj.link || obj.contents) renvoie vrai ;
        si (typeof XMLHttpRequest != 'undefined') {
          throw new Error("Le chargement paresseux aurait dû être effectué (contenu défini) dans createLazyFile, mais ce n'est pas le cas. Le chargement paresseux ne fonctionne que dans les workers Web. Utilisez --embed-file ou --preload-file dans emcc sur le thread principal.");
        } sinon si (lire_) {
          // Ligne de commande.
          essayer {
            // AVERTISSEMENT : impossible de lire les fichiers binaires dans le d8 de V8 ou le js de tracemonkey, car
            // read() tentera d'analyser UTF8.
            obj.contents = intArrayFromString(lire_(obj.url), true);
            obj.usedBytes = obj.contenu.longueur;
          } attraper (e) {
            lancer une nouvelle FS.ErrnoError(29);
          }
        } autre {
          throw new Error('Impossible de charger sans read() ou XMLHttpRequest.');
        }
      },createLazyFile:(parent, nom, url, peut lire, peut écrire) => {
        // Uint8Array fragmenté en mode paresseux (implémente get et length à partir de Uint8Array). L'obtention réelle est abstraite pour une réutilisation éventuelle.
        /** @constructeur */
        fonction LazyUint8Array() {
          ceci.lengthKnown = faux;
          this.chunks = []; // Blocs chargés. L'index est le numéro du bloc
        }
        LazyUint8Array.prototype.get = /** @this{Object} */ fonction LazyUint8Array_get(idx) {
          si (idx > this.length-1 || idx < 0) {
            retourner indéfini;
          }
          var chunkOffset = idx % this.chunkSize;
          var chunkNum = (idx / this.chunkSize)|0;
          renvoyer ceci.getter(chunkNum)[chunkOffset];
        };
        LazyUint8Array.prototype.setDataGetter = fonction LazyUint8Array_setDataGetter(getter) {
          ceci.getter = getter;
        };
        LazyUint8Array.prototype.cacheLength = fonction LazyUint8Array_cacheLength() {
          // Trouver la longueur
          var xhr = new XMLHttpRequest();
          xhr.open('HEAD', url, false);
          xhr.envoyer(null);
          si (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) génère une nouvelle erreur ("Impossible de charger " + url + ". Statut : " + xhr.status);
          var datalength = Number(xhr.getResponseHeader("Contenu-longueur"));
          var en-tête;
          var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "octets";
          var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
  
          var chunkSize = 1024*1024; // Taille du bloc en octets
  
          si (!hasByteServing) chunkSize = datalength;
  
          // Fonction permettant d'obtenir une plage à partir de l'URL distante.
          var doXHR = (de, à) => {
            si (de > à) renvoie une nouvelle erreur ("plage non valide (" + de + ", " + à + ") ou aucun octet demandé !");
            si (à > datalength-1) lancer une nouvelle erreur ("seulement " + datalength + " octets disponibles ! erreur du programmeur !");
  
            // TODO : utiliser mozResponseArrayBuffer, responseStream, etc. s'ils sont disponibles.
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            si (datalength !== chunkSize) xhr.setRequestHeader("Plage", "octets=" + de + "-" + à);
  
            // Quelques indications au navigateur indiquant que nous voulons des données binaires.
            xhr.responseType = 'tableautampon';
            si (xhr.overrideMimeType) {
              xhr.overrideMimeType('texte/plain; charset=x-défini par l'utilisateur');
            }
  
            xhr.envoyer(null);
            si (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) génère une nouvelle erreur ("Impossible de charger " + url + ". Statut : " + xhr.status);
            si (xhr.response !== indéfini) {
              renvoyer un nouveau Uint8Array(/** @type{Array<numéro>} */(xhr.response || []));
            } autre {
              renvoyer intArrayFromString(xhr.responseText || '', true);
            }
          };
          var lazyArray = ceci;
          lazyArray.setDataGetter((chunkNum) => {
            var début = chunkNum * chunkSize;
            var end = (chunkNum+1) * chunkSize - 1; // y compris cet octet
            end = Math.min(end, datalength-1); // si datalength-1 est sélectionné, il s'agit du dernier bloc
            si (typeof lazyArray.chunks[chunkNum] == 'undefined') {
              lazyArray.chunks[chunkNum] = doXHR(début, fin);
            }
            si (typeof lazyArray.chunks[chunkNum] == 'undefined') renvoie une nouvelle erreur ('doXHR a échoué !');
            renvoyer lazyArray.chunks[chunkNum];
          });
  
          si (usesGzip || !datalength) {
            // si le serveur utilise gzip ou ne fournit pas la longueur, nous devons télécharger le fichier entier pour obtenir la longueur (non compressée)
            chunkSize = datalength = 1; // cela forcera getter(0)/doXHR à télécharger le fichier entier
            longueur des données = this.getter(0).length;
            chunkSize = longueur des données;
            out("LazyFiles sur gzip force le téléchargement de l'intégralité du fichier lorsque la longueur est atteinte");
          }
  
          this._length = longueur des données;
          this._chunkSize = taille du morceau;
          ceci.lengthKnown = vrai;
        };
        si (typeof XMLHttpRequest != 'undefined') {
          si (!ENVIRONMENT_IS_WORKER) renvoie « Impossible d'effectuer des XHR binaires synchrones en dehors des webworkers dans les navigateurs modernes. Utilisez --embed-file ou --preload-file dans emcc » ;
          var lazyArray = new LazyUint8Array();
          Objet.defineProperties(lazyArray, {
            longueur: {
              obtenir : /** @this{Object} */ function() {
                si (!this.lengthKnown) {
                  ceci.cacheLength();
                }
                renvoie ceci._length;
              }
            },
            taille du morceau : {
              obtenir : /** @this{Object} */ function() {
                si (!this.lengthKnown) {
                  ceci.cacheLength();
                }
                renvoie this._chunkSize;
              }
            }
          });
  
          var propriétés = { isDevice: false, contenu: lazyArray };
        } autre {
          var propriétés = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, nom, propriétés, canRead, canWrite);
        // C'est un hack total, mais je veux sortir ce code de fichier paresseux du
        // cœur de MEMFS. Si nous voulons conserver ce concept de fichier paresseux, je pense qu'il devrait
        // être son propre proxy LAZYFS mince pour les appels à MEMFS.
        si (propriétés.contenu) {
          node.contents = propriétés.contenu;
        } sinon si (properties.url) {
          nœud.contenu = null;
          node.url = propriétés.url;
        }
        // Ajoutez une fonction qui diffère l'interrogation de la taille du fichier jusqu'à ce qu'elle soit demandée la première fois.
        Objet.defineProperties(nœud, {
          octets utilisés : {
            obtenir : /** @this {FSNode} */ function() { return this.contents.length; }
          }
        });
        // remplacez chaque opération de flux par une autre qui essaie de forcer le chargement du fichier paresseux en premier
        var stream_ops = {};
        var clés = Objet.clés(node.stream_ops);
        clés.forEach((clé) => {
          var fn = node.stream_ops[clé];
          stream_ops[clé] = fonction forceLoadLazyFile() {
            FS.forceLoadFile(nœud);
            retourner fn.apply(null, arguments);
          };
        });
        // utiliser une fonction de lecture personnalisée
        stream_ops.read = (flux, tampon, décalage, longueur, position) => {
          FS.forceLoadFile(nœud);
          var contenu = stream.node.contents;
          si (position >= contenu.longueur)
            retourner 0;
          var size = Math.min(contenu.longueur - position, longueur);
          assert(taille >= 0);
          si (contenu.tranche) { // tableau normal
            pour (var i = 0; i < taille; i++) {
              tampon[offset + i] = contenu[position + i];
            }
          } autre {
            pour (var i = 0; i < size; i++) { // LazyUint8Array à partir du binaire de synchronisation XHR
              buffer[offset + i] = contenu.get(position + i);
            }
          }
          taille de retour;
        };
        nœud.stream_ops = stream_ops;
        nœud de retour;
      },createPreloadedFile:(parent, nom, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) => {
        // TODO nous devrions permettre aux gens de simplement transmettre un nom de fichier complet à la place
        // du parent et du nom étant donné que nous les rejoignons de toute façon
        var fullname = nom ? PATH_FS.resolve(PATH.join2(parent, nom)) : parent;
        var dep = getUniqueRunDependency('cp ' + fullname); // peut avoir plusieurs requêtes actives pour le même nom complet
        fonction processData(byteArray) {
          fonction terminer(byteArray) {
            si (pré-finition) pre-finition();
            si (!dontCreateFile) {
              FS.createDataFile(parent, nom, byteArray, peut lire, peut écrire, peut posséder);
            }
            si (onload) onload();
            supprimerRunDependency(dépendance);
          }
          si (Browser.handledByPreloadPlugin(byteArray, nom complet, terminer, () => {
            si (onerror) onerror();
            supprimerRunDependency(dépendance);
          })) {
            retour;
          }
          terminer(byteArray);
        }
        addRunDependency(dépendance);
        si (typeof url == 'chaîne') {
          asyncLoad(url, (byteArray) => processData(byteArray), onerror);
        } autre {
          processusData(url);
        }
      },indexedDB:() => {
        renvoie window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:() => {
        retourner 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:(chemins, onload, onerror) => {
        onload = onload || (() => {});
        uneerreur = uneerreur || (() => {});
        var indexedDB = FS.indexedDB();
        essayer {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } attraper (e) {
          renvoie onerror(e);
        }
        openRequest.onupgradeneeded = () => {
          out('création de la base de données');
          var db = openRequest.résultat;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = () => {
          var db = openRequest.résultat;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'lecture-écriture');
          var fichiers = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = chemins.length;
          fonction terminer() {
            si (fail == 0) onload(); sinon onerror();
          }
          chemins.forEach((chemin) => {
            var putRequest = files.put(FS.analyzePath(chemin).object.contents, chemin);
            putRequest.onsuccess = () => { ok++; si (ok + échec == total) terminer() };
            putRequest.onerror = () => { fail++; si (ok + fail == total) terminer() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:(chemins, onload, onerror) => {
        onload = onload || (() => {});
        uneerreur = uneerreur || (() => {});
        var indexedDB = FS.indexedDB();
        essayer {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } attraper (e) {
          renvoie onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // aucune base de données à partir de laquelle charger
        openRequest.onsuccess = () => {
          var db = openRequest.résultat;
          essayer {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'lecture seule');
          } attraper(e) {
            une erreur(e);
            retour;
          }
          var fichiers = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = chemins.length;
          fonction terminer() {
            si (fail == 0) onload(); sinon onerror();
          }
          chemins.forEach((chemin) => {
            var getRequest = fichiers.get(chemin);
            getRequest.onsuccess = () => {
              si (FS.analyzePath(chemin).existe) {
                FS.unlink(chemin);
              }
              FS.createDataFile(PATH.dirname(chemin), PATH.basename(chemin), getRequest.result, true, true, true);
              d'accord++;
              si (ok + échec == total) terminer();
            };
            getRequest.onerror = () => { fail++; si (ok + fail == total) terminer() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },cheminabsolu:() => {
        abort('FS.absolutePath a été supprimé ; utilisez plutôt PATH_FS.resolve');
      },createFolder:() => {
        abort('FS.createFolder a été supprimé ; utilisez plutôt FS.mkdir');
      },createLink:() => {
        abort('FS.createLink a été supprimé ; utilisez plutôt FS.symlink');
      },joinPath:() => {
        abort('FS.joinPath a été supprimé ; utilisez plutôt PATH.join');
      },mmapAlloc:() => {
        abort('FS.mmapAlloc a été remplacé par la fonction de niveau supérieur mmapAlloc');
      },standardizePath:() => {
        abort('FS.standardizePath a été supprimé ; utilisez plutôt PATH.normalize');
      }};
  var SYSCALLS = {DEFAULT_POLLMASK:5,calculateAt:function(dirfd, chemin, allowEmpty) {
        si (chemin[0] === '/') {
          chemin de retour;
        }
        // chemin relatif
        var dir;
        si (dirfd === -100) {
          dir = FS.cwd();
        } autre {
          var dirstream = FS.getStream(dirfd);
          si (!dirstream) lance une nouvelle FS.ErrnoError(8);
          dir = dirstream.chemin;
        }
        si (chemin.longueur == 0) {
          si (!allowEmpty) {
            lancer une nouvelle FS.ErrnoError(44);;
          }
          retourner dir;
        }
        renvoie PATH.join2(dir, chemin);
      },doStat:function(func, chemin, buf) {
        essayer {
          var stat = func(chemin);
        } attraper (e) {
          si (e && e.node && PATH.normalize(chemin) !== PATH.normalize(FS.getPath(e.node))) {
            // une erreur s'est produite lors de la tentative de recherche du chemin ; nous devrions simplement signaler ENOTDIR
            retour -54;
          }
          jeter e;
        }
        HEAP32[((buf)>>2)] = stat.dev;
        HEAP32[(((buf)+(4))>>2)] = 0;
        HEAP32[(((buf)+(8))>>2)] = stat.ino;
        HEAP32[(((buf)+(12))>>2)] = stat.mode;
        HEAP32[(((buf)+(16))>>2)] = stat.nlink;
        HEAP32[(((buf)+(20))>>2)] = stat.uid;
        HEAP32[(((buf)+(24))>>2)] = stat.gid;
        HEAP32[(((buf)+(28))>>2)] = stat.rdev;
        HEAP32[(((buf)+(32))>>2)] = 0;
        (tempI64 = [stat.size>>>0,(tempDouble=stat.size,(+(Math.abs(tempDouble))) >= 1,0 ? (tempDouble > 0,0 ? ((Math.min((+(Math.floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[(((buf)+(40))>>2)] = tempI64[0],HEAP32[(((buf)+(44))>>2)] = tempI64[1]);
        HEAP32[(((buf)+(48))>>2)] = 4096;
        HEAP32[(((buf)+(52))>>2)] = stat.blocks;
        HEAP32[(((buf)+(56))>>2)] = (stat.atime.getTime() / 1000)|0;
        HEAP32[(((buf)+(60))>>2)] = 0;
        HEAP32[(((buf)+(64))>>2)] = (stat.mtime.getTime() / 1000)|0;
        HEAP32[(((buf)+(68))>>2)] = 0;
        HEAP32[(((buf)+(72))>>2)] = (stat.ctime.getTime() / 1000)|0;
        HEAP32[(((buf)+(76))>>2)] = 0;
        (tempI64 = [stat.ino>>>0,(tempDouble=stat.ino,(+(Math.abs(tempDouble))) >= 1,0 ? (tempDouble > 0,0 ? ((Math.min((+(Math.floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[(((buf)+(80))>>2)] = tempI64[0],HEAP32[(((buf)+(84))>>2)] = tempI64[1]);
        retourner 0;
      },doMsync:function(addr, stream, len, flags, offset) {
        var buffer = HEAPU8.slice(adresse, adresse + longueur);
        FS.msync(flux, tampon, décalage, longueur, indicateurs);
      },doMkdir:function(chemin, mode) {
        // supprimer une barre oblique de fin, s'il y en a une - /a/b/ a un nom de base de '', mais
        // nous voulons créer b dans le contexte de cette fonction
        chemin = CHEMIN.normalize(chemin);
        si (chemin[chemin.longueur-1] === '/') chemin = chemin.substr(0, chemin.longueur-1);
        FS.mkdir(chemin, mode, 0);
        retourner 0;
      },doMknod:function(chemin, mode, dev) {
        // nous ne voulons pas de cela dans l'API JS car il utilise mknod pour créer tous les nœuds.
        commutateur (mode et 61440) {
          cas 32768:
          cas 8192:
          cas 24576:
          cas 4096:
          cas 49152:
            casser;
          par défaut : renvoie -28 ;
        }
        FS.mknod(chemin, mode, dev);
        retourner 0;
      },doReadlink:function(chemin, buf, bufsize) {
        si (bufsize <= 0) renvoie -28 ;
        var ret = FS.readlink(chemin);
  
        var len = Math.min(bufsize, lengthBytesUTF8(ret));
        var endChar = HEAP8[buf+len];
        chaîneToUTF8(ret, buf, bufsize+1);
        // readlink est l'une des rares fonctions qui écrivent une chaîne C, mais n'ajoute jamais de null au tampon de sortie (!)
        // stringToUTF8() ajoute toujours un octet nul, donc restaurez le caractère sous l'octet nul après l'écriture.
        HEAP8[buf+len] = finChar;
  
        retourner len;
      },doAccess:function(chemin, amode) {
        si (amode & ~7) {
          // besoin d'un mode valide
          retour -28;
        }
        var lookup = FS.lookupPath(chemin, { suivre : vrai });
        var nœud = lookup.nœud;
        si (!nœud) {
          retour -44;
        }
        var perms = '';
        si (amode & 4) perms += 'r';
        si (amode & 2) perms += 'w';
        si (amode & 1) perms += 'x';
        si (perms /* sinon, ils viennent de passer F_OK */ && FS.nodePermissions(node, perms)) {
          retour -2;
        }
        retourner 0;
      },doReadv:function(flux, iov, iovcnt, décalage) {
        var ret = 0;
        pour (var i = 0; i < iovcnt; i++) {
          var ptr = HEAP32[(((iov)+(i*8))>>2)];
          var len = HEAP32[(((iov)+(i*8 + 4))>>2)];
          var curr = FS.read(flux, HEAP8,ptr, len, décalage);
          si (curr < 0) renvoie -1 ;
          ret += curr;
          si (curr < len) break; // rien d'autre à lire
        }
        retour ret;
      },doWritev:function(flux, iov, iovcnt, décalage) {
        var ret = 0;
        pour (var i = 0; i < iovcnt; i++) {
          var ptr = HEAP32[(((iov)+(i*8))>>2)];
          var len = HEAP32[(((iov)+(i*8 + 4))>>2)];
          var curr = FS.write(flux, HEAP8,ptr, longueur, décalage);
          si (curr < 0) renvoie -1 ;
          ret += curr;
        }
        retour ret;
      },varargs:non défini,obtenir:fonction() {
        assert(SYSCALLS.varargs != indéfini);
        Appels système.varargs += 4;
        var ret = HEAP32[(((SYSCALLS.varargs)-(4))>>2)];
        retour ret;
      },getStr:fonction(ptr) {
        var ret = UTF8ToString(ptr);
        retour ret;
      },getStreamFromFD:fonction(fd) {
        var stream = FS.getStream(fd);
        si (!stream) lance une nouvelle FS.ErrnoError(8);
        flux de retour;
      },get64:function(bas, haut) {
        si (bas >= 0) assert(haut === 0);
        sinon assert(high === -1);
        retour bas;
      }};
  fonction __mmap_js(addr, len, prot, flags, fd, off, alloué, intégré) {
  essayer {
  
      var info = FS.getStream(fd);
      si (!info) renvoie -8 ;
      var res = FS.mmap(info, adresse, longueur, off, prot, drapeaux);
      var ptr = res.ptr;
      HEAP32[((alloué)>>2)] = res.alloué ;
      retourner ptr;
    } attraper (e) {
    si (typeof FS == 'undefined' || !(e instanceof FS.ErrnoError)) lancer e;
    retourner -e.errno;
  }
  }

  fonction __munmap_js(addr, len, prot, drapeaux, fd, offset) {
  essayer {
  
      var stream = FS.getStream(fd);
      si (flux) {
        si (prot & 2) {
          SYSCALLS.doMsync(addr, flux, longueur, indicateurs, décalage);
        }
        FS.munmap(flux);
      }
    } attraper (e) {
    si (typeof FS == 'undefined' || !(e instanceof FS.ErrnoError)) lancer e;
    retourner -e.errno;
  }
  }

  fonction _abort() {
      abort('code natif appelé abort()');
    }

  fonction _emscripten_console_error(str) {
      assert(typeof str == 'numéro');
      console.error(UTF8ToString(str));
    }

  fonction _emscripten_get_heap_max() {
      // Restez une page Wasm en deçà de 4 Go : alors que par exemple Chrome est capable d'allouer
      // mémoires Wasm complètes de 4 Go, la taille reviendra à 0 octet côté Wasm
      // pour tout code qui traite des tailles de tas, ce qui nécessiterait des
      // mise en boîte de tout le code lié à la taille du tas pour traiter 0 spécialement.
      retour 2147483648;
    }

  var _emscripten_get_now;si (ENVIRONNEMENT_EST_NOEUD) {
    _emscripten_get_now = () => {
      var t = processus['hrtime']();
      retourner t[0] * 1e3 + t[1] / 1e6;
    };
  } else _emscripten_get_now = () => performance.now();
  ;

  fonction _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.copyWithin(dest, src, src + num);
    }

  fonction emscripten_realloc_buffer(taille) {
      essayer {
        // demande de croissance de taille ronde jusqu'à la taille de la page wasm (64 Ko fixes par spécification)
        wasmMemory.grow((size - buffer.byteLength + 65535) >>> 16); // .grow() prend un delta par rapport à la taille précédente
        updateGlobalBufferAndViews(wasmMemory.buffer);
        retour 1 /*succès*/;
      } attraper(e) {
        err('emscripten_realloc_buffer : tentative d'augmentation du tas de ' + buffer.byteLength + ' octets à ' + size + ' octets, mais erreur obtenue : ' + e);
      }
      // retour implicite 0 pour enregistrer la taille du code (l'appelant convertira « undefined » en 0
      // de toute façon)
    }
  fonction _emscripten_resize_heap(taille demandée) {
      var oldSize = HEAPU8.longueur;
      taille demandée = taille demandée >>> 0;
      // Avec les builds multithread, des courses peuvent se produire (un autre thread peut augmenter la taille
      // entre les deux), renvoyez donc un échec et laissez l'appelant réessayer.
      assert(taille demandée > ancienne taille);
  
      // Règles de redimensionnement de la mémoire :
      // 1. Augmentez toujours la taille du tas au moins à la taille demandée, arrondie au supérieur
      // vers la page suivante multiple.
      // 2a. Si MEMORY_GROWTH_LINEAR_STEP == -1, redimensionner excessivement le tas
      // géométriquement : augmenter la taille du tas en fonction de
      // Facteur MEMORY_GROWTH_GEOMETRIC_STEP (par défaut +20%), Au plus
      // surréservation de MEMORY_GROWTH_GEOMETRIC_CAP octets (par défaut 96 Mo).
      // 2b. Si MEMORY_GROWTH_LINEAR_STEP != -1, redimensionner excessivement le tas
      // linéairement : augmenter la taille du tas d'au moins
      // CROISSANCE_LINÉAIRE_DE_LA_MÉMOIRE octets.
      // 3. La taille maximale du tas est limitée à 2048 Mo-WASM_PAGE_SIZE, ou par
      // MAXIMUM_MEMORY, ou par limite ASAN, selon celle qui est la plus petite
      // 4. Si nous n'avons pas pu allouer autant de mémoire, cela peut être dû à
      // décision trop hâtive de réserver de manière excessive en raison du point (3) ci-dessus.
      // Par conséquent, si une allocation échoue, réduisez le montant de l'excédent
      // croissance, dans une tentative de réussir à effectuer une allocation plus petite.
  
      // Une limite est fixée quant à notre croissance. Nous ne devons pas la dépasser
      // (le binaire wasm le spécifie, donc si nous essayions, nous échouerions de toute façon).
      var maxHeapSize = _emscripten_get_heap_max();
      si (taille demandée > taille maxHeap) {
        err('Impossible d'agrandir la mémoire, demande d'aller jusqu'à ' + askedSize + ' octets, mais la limite est ' + maxHeapSize + ' octets !');
        retourner faux;
      }
  
      laissez alignUp = (x, multiple) => x + (multiple - x % multiple) % multiple;
  
      // Boucle à travers les augmentations potentielles de la taille du tas. Si nous essayons une approche trop impatiente
      // réservation qui échoue, réduisez la taille tentée et réservez un
      // une bosse plus petite à la place. (max 3 fois, choisie de manière quelque peu arbitraire)
      pour (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
        var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown); // assurer la croissance géométrique
        // mais limitez la surréservation (par défaut, plafonnement à +96 Mo de surcroissance au maximum)
        overGrownHeapSize = Math.min(overGrownHeapSize, taille demandée + 100663296 );
  
        var nouvelleTaille = Math.min(maxHeapSize, alignUp(Math.max(taille demandée, overGrownHeapSize), 65536));
  
        var remplacement = emscripten_realloc_buffer(newSize);
        si (remplacement) {
  
          renvoie vrai ;
        }
      }
      err('Échec de la croissance du tas de ' + oldSize + ' octets à ' + newSize + ' octets, pas assez de mémoire !');
      retourner faux;
    }

  var ENV = {};
  
  fonction getExecutableName() {
      retourner ce programme || './this.program';
    }
  fonction getEnvStrings() {
      si (!getEnvStrings.strings) {
        // Valeurs par défaut.
        // Détection de la langue du navigateur #8751
        var lang = ((typeof navigator == 'objet' && navigator.languages ​​&& navigator.languages[0]) || 'C').replace('-', '_') + '.UTF-8';
        var env = {
          'UTILISATEUR' : 'utilisateur_web',
          'LOGNAME': 'utilisateur_web',
          'CHEMIN': '/',
          'PWD': '/',
          'ACCUEIL' : '/home/web_user',
          'LANG' : langue,
          '_': getExecutableName()
        };
        // Appliquer les valeurs fournies par l'utilisateur, le cas échéant.
        pour (var x dans ENV) {
          // x est une clé dans ENV ; si ENV[x] n'est pas défini, cela signifie qu'il a été
          // explicitement défini comme tel. Nous autorisons le code utilisateur à faire cela pour
          // forcer les variables avec des valeurs par défaut à rester non définies.
          si (ENV[x] === indéfini) supprimer env[x] ;
          sinon env[x] = ENV[x];
        }
        var chaînes = [];
        pour (var x dans env) {
          chaînes.push(x + '=' + env[x]);
        }
        getEnvStrings.strings = chaînes;
      }
      renvoie getEnvStrings.strings;
    }
  fonction _environ_get(__environ, environ_buf) {
      var bufSize = 0;
      getEnvStrings().forEach(fonction(chaîne, i) {
        var ptr = environ_buf + bufSize;
        HEAP32[(((__environ)+(i * 4))>>2)] = ptr;
        writeAsciiToMemory(chaîne, ptr);
        bufSize += chaîne.length + 1;
      });
      retourner 0;
    }

  fonction _environ_sizes_get(penviron_count, penviron_buf_size) {
      var chaînes = getEnvStrings();
      HEAP32[((penviron_count)>>2)] = chaînes.length;
      var bufSize = 0;
      chaînes.forEach(fonction(chaîne) {
        bufSize += chaîne.length + 1;
      });
      HEAP32[((penviron_buf_size)>>2)] = bufSize;
      retourner 0;
    }

  fonction _exit(état) {
      // void _exit(int état);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      sortie(état);
    }

  fonction _fd_close(fd) {
  essayer {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      FS.close(flux);
      retourner 0;
    } attraper (e) {
    si (typeof FS == 'undefined' || !(e instanceof FS.ErrnoError)) lancer e;
    retourner e.errno;
  }
  }

  fonction _fd_read(fd, iov, iovcnt, pnum) {
  essayer {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      var num = SYSCALLS.doReadv(flux, iov, iovcnt);
      HEAP32[((pnum)>>2)] = num;
      retourner 0;
    } attraper (e) {
    si (typeof FS == 'undefined' || !(e instanceof FS.ErrnoError)) lancer e;
    retourner e.errno;
  }
  }

  fonction _fd_seek(fd, offset_low, offset_high, d'où, newOffset) {
  essayer {
  
      
      var stream = SYSCALLS.getStreamFromFD(fd);
      var HIGH_OFFSET = 0x100000000 ; // 2 ^ 32
      // utiliser un opérateur non signé sur le niveau bas et décaler le niveau haut de 32 bits
      var décalage = décalage_haut * DÉCALAGE_HAUT + (décalage_bas >>> 0);
  
      var DOUBLE_LIMIT = 0x20000000000000; // 2^53
      // on vérifie aussi l'égalité puisque DOUBLE_LIMIT + 1 == DOUBLE_LIMIT
      si (décalage <= -DOUBLE_LIMIT || décalage >= DOUBLE_LIMIT) {
        retour -61;
      }
  
      FS.llseek(flux, décalage, d'où);
      (tempI64 = [stream.position>>>0,(tempDouble=stream.position,(+(Math.abs(tempDouble))) >= 1,0 ? (tempDouble > 0,0 ? ((Math.min((+(Math.floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((nouveauDécalage)>>2)] = tempI64[0],HEAP32[(((nouveauDécalage)+(4))>>2)] = tempI64[1]);
      si (stream.getdents && offset === 0 && d'où === 0) stream.getdents = null; // réinitialiser l'état readdir
      retourner 0;
    } attraper (e) {
    si (typeof FS == 'undefined' || !(e instanceof FS.ErrnoError)) lancer e;
    retourner e.errno;
  }
  }

  fonction _fd_write(fd, iov, iovcnt, pnum) {
  essayer {
  
      ;
      var stream = SYSCALLS.getStreamFromFD(fd);
      var num = SYSCALLS.doWritev(flux, iov, iovcnt);
      HEAP32[((pnum)>>2)] = num;
      retourner 0;
    } attraper (e) {
    si (typeof FS == 'undefined' || !(e instanceof FS.ErrnoError)) lancer e;
    retourner e.errno;
  }
  }

  fonction _getentropy(tampon, taille) {
      si (!_getentropy.randomDevice) {
        _getentropy.randomDevice = getRandomDevice();
      }
      pour (var i = 0; i < taille; i++) {
        HEAP8[(((tampon)+(i))>>0)] = _getentropy.randomDevice();
      }
      retourner 0;
    }

  fonction _setTempRet0(val) {
      setTempRet0(val);
    }
embind_init_charCodes();
BindingError = Module['BindingError'] = extendError(Erreur, 'BindingError');;
InternalError = Module['InternalError'] = extendError(Erreur, 'InternalError');;
init_ClassHandle();
init_embind();;
init_RegisteredPointer();
UnboundTypeError = Module['UnboundTypeError'] = extendError(Erreur, 'UnboundTypeError');;
init_emval();;

  var FSNode = /** @constructor */ fonction(parent, nom, mode, rdev) {
    si (!parent) {
      parent = this; // le nœud racine définit le parent sur lui-même
    }
    ceci.parent = parent;
    cette.monture = parent.monture;
    ceci.monté = null;
    ceci.id = FS.nextInode++;
    ceci.nom = nom;
    ce.mode = mode;
    ceci.node_ops = {};
    ceci.stream_ops = {};
    ceci.rdev = rdev;
  };
  var mode lecture = 292/*292*/ | 73/*73*/;
  var writeMode = 146/*146*/;
  Objet.defineProperties(FSNode.prototype, {
   lire: {
    obtenir : /** @this{FSNode} */function() {
     retour (this.mode & readMode) === readMode;
    },
    définir : /** @this{FSNode} */function(val) {
     val ? this.mode |= readMode : this.mode &= ~readMode;
    }
   },
   écrire: {
    obtenir : /** @this{FSNode} */function() {
     retour (this.mode & writeMode) === writeMode;
    },
    définir : /** @this{FSNode} */function(val) {
     val ? this.mode |= writeMode : this.mode &= ~writeMode;
    }
   },
   isFolder : {
    obtenir : /** @this{FSNode} */function() {
     retourner FS.isDir(this.mode);
    }
   },
   estDevice: {
    obtenir : /** @this{FSNode} */function() {
     renvoie FS.isChrdev(this.mode);
    }
   }
  });
  FS.FSNode = FSNode;
  FS.staticInit();;
CODES_ERREUR = {
      'EPERM': 63,
      'ENOENT': 44,
      'ESRCH': 71,
      'EINTR': 27,
      « EIO » : 29,
      'ENXIO': 60,
      « E2BIG » : 1,
      'ENOEXEC': 45,
      « EBADF » : 8,
      'ECHILD': 12,
      'EAGAIN': 6,
      « EWOULDBLOCK » : 6,
      'ENOMEM': 48,
      'EACCES': 2,
      'EFFAUT': 21,
      'ENOTBLK': 105,
      « EBUSY » : 10,
      'EEXISTE': 20,
      'EXDEV': 75,
      'ENODEV': 43,
      'ENOTDIR': 54,
      'EISDIR': 31,
      'EINVAL': 28,
      'ENFILE': 41,
      'EMFILE': 33,
      'ENOTTY': 59,
      « ETXTBSY » : 74,
      « EFBIG » : 22,
      'ENOSPC': 51,
      'ESPIPE': 70,
      « EROFS » : 69,
      « EMLINK » : 34,
      'ÉPIPE': 64,
      « EDOM » : 18,
      'ERANGE': 68,
      'ENOMSG': 49,
      « EIDRM » : 24,
      'ECHRNG': 106,
      'EL2NSYNC': 156,
      'EL3HLT': 107,
      'EL3RST': 108,
      'ELNRNG': 109,
      'EUNATCH': 110,
      'ENOCSI': 111,
      'EL2HLT': 112,
      'EDEADLK': 16,
      'ENOLCK': 46,
      'ÉBADE': 113,
      'EBADR': 114,
      'EXFULL': 115,
      'ENOANO': 104,
      'EBADRQC': 103,
      'EBADSLT': 102,
      « EDEADLOCK » : 16,
      'EBFONT': 101,
      'ENOSTR': 100,
      'ENODATA': 116,
      'ETIME': 117,
      'ENOSR': 118,
      'ENONET': 119,
      'ENOPKG': 120,
      'EREMOTE': 121,
      'ENOLINK': 47,
      'EADV': 122,
      « ESRMNT » : 123,
      'ECOMM': 124,
      'EPROTO': 65,
      'ÉMULTIHOP': 36,
      'EDOTDOT': 125,
      'EBADMSG': 9,
      'ENOTUNIQ': 126,
      'EBADFD': 127,
      'EREMCHG': 128,
      'ELIBACC': 129,
      'ELIBBAD': 130,
      'ELIBSCN': 131,
      'ELIBMAX': 132,
      'ELIBEXEC': 133,
      'ENOSYS': 52,
      'ENOTEMPTY': 55,
      'ENAMETOOLONG': 37,
      'ELOOP': 32,
      'EOPNOTSUPP': 138,
      'EPFNOSUPPORT': 139,
      'ECONNRESET': 15,
      'ENOBUFS': 42,
      'EAFNOSUPPORT': 5,
      'EPROTOTYPE': 67,
      'ENOTSOCK': 57,
      'ENOPROTOOPT': 50,
      « ARRÊT » : 140,
      'ECONNREFUSED': 14,
      'EADDRINUSE': 3,
      'ECONNABORTED': 13,
      « ENETUNREACH » : 40,
      « NETDOWN » : 38,
      'ETIMEDOUT': 73,
      « EHOSTDOWN » : 142,
      « EHOSTUNREACH » : 23,
      « EN PROGRESSION » : 26,
      'DÉJÀ' : 7,
      'EDESTADDRREQ': 17,
      « EMSGSIZE » : 35,
      'EPROTONOSUPPORT': 66,
      'ESOCKTNOSUPPORT': 137,
      'EADDRNOTAVAIL': 4,
      'ENETRESET': 39,
      'EISCONN': 30,
      'ENOTCONN': 53,
      'ETOOMANYREFS': 141,
      « EUSERS » : 136,
      « EDQUOT » : 19,
      'ESTALE': 72,
      'ENOTSUP': 138,
      'ENOMEDIUM': 148,
      « EILSEQ » : 25,
      'EOVERFLOW': 61,
      'ÉCANNULÉ': 11,
      'ENOTRECOUVRABLE': 56,
      « PROPRIÉTAIRE MORTE » : 62,
      'ESTRPIPE': 135,
    };;
var ASSERTIONS = vrai;



/** @type {fonction(chaîne, booléen=, nombre=)} */
fonction intArrayFromString(stringy, dontAddNull, longueur) {
  var len = longueur > 0 ? longueur : lengthBytesUTF8(stringy)+1;
  var u8array = nouveau tableau(len);
  var numBytesWritten = chaîneToUTF8Array(chaîne, u8array, 0, u8array.length);
  si (dontAddNull) u8array.length = numBytesWritten;
  retourner u8array;
}

fonction intArrayToString(tableau) {
  var ret = [];
  pour (var i = 0; i < tableau.length; i++) {
    var chr = tableau[i];
    si (chr > 0xFF) {
      si (ASSERTIONS) {
        assert(false, 'Code de caractère ' + chr + ' (' + String.fromCharCode(chr) + ') au décalage ' + i + ' pas dans 0x00-0xFF.');
      }
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  retourner ret.join('');
}


fonction checkIncomingModuleAPI() {
  ignoréModuleProp('fetchSettings');
}
var asmLibraryArg = {
  "_ZN6tflite8resource16ResourceVariable10AssignFromEPK12TfLiteTensor": __ZN6tflite8resource16ResourceVariable10AssignFromEPK12TfLiteTensor,
  "_ZN6tflite8resource19GetResourceVariableEPNSt3__213carte_non_ordonnéeIiNS1_10ptr_unique_INS0_12ResourceBaseENS1_14suppression_par_défautIS4_EEEENS1_4hashIiEENS1_8égal_àIiEENS1_9allocateurINS1_4paireIKiS7_EEEEEEi": __ZN6tflite8resource19GetResourceVariableEPNSt3__213carte_non_ordonnéeIiNS1_10ptr_unique_INS0_12ResourceBaseENS1_14suppression_par_défautIS4_EEEENS1_4hashIiEENS1_8égal_àIiEENS1_9allocateurINS1_4paireIKiS7_EEEEEEi,
  "_ZN6tflite8resource20GetHashtableResourceEPNSt3__213carte_non_ordonnéeIiNS1_10ptr_unique_INS0_12ResourceBaseENS1_14suppression_par_défautIS4_EEEENS1_4hashIiEENS1_8égal_àIiEENS1_9allocateurINS1_4paireIKiS7_EEEEEEi": __ZN6tflite8resource20GetHashtableResourceEPNSt3__213carte_non_ordonnéeIiNS1_10ptr_unique_INS0_12ResourceBaseENS1_14suppression_par_défautIS4_EEEENS1_4hashIiEENS1_8égal_àIiEENS1_9allocateurINS1_4paireIKiS7_EEEEEEi,
  "_ZN6tflite8resource20InitializationStatus24MarkInitializationIsDoneEv": __ZN6tflite8resource20InitializationStatus24MarkInitializationIsDoneEv,
  "_ZN6tflite8resource23GetInitializationStatusEPNSt3__213carte_non_ordonnéeIiNS1_10ptr_uniqueINS0_20InitializationStatusENS1_14suppression_par_défautIS4_EEEENS1_4hashIiEENS1_8égal_àIiEENS1_9allocateurINS1_4paireIKiS7_EEEEEEi": __ZN6tflite8resource23GetInitializationStatusEPNSt3__213carte_non_ordonnéeIiNS1_10ptr_uniqueINS0_20InitializationStatusENS1_14suppression_par_défautIS4_EEEENS1_4hashIiEENS1_8égal_àIiEENS1_9allocateurINS1_4paireIKiS7_EEEEEEi,
  "_ZN6tflite8resource36CreateResourceVariableIfNotAvailableEPNSt3__213carte_non_ordonnéeIiNS1_10ptr_uniqueINS0_12ResourceBaseENS1_14suppression_par_défautIS4_EEEENS1_4hashIiEENS1_8égal_àIiEENS1_9allocateurINS1_4paireIKiS7_EEEEEEi": __ZN6tflite8resource36CreateResourceVariableIfNotAvailableEPNSt3__213carte_non_ordonnéeIiNS1_10ptr_uniqueINS0_12ResourceBaseENS1_14suppression_par_défautIS4_EEEENS1_4hashIiEENS1_8égal_àIiEENS1_9allocateurINS1_4paireIKiS7_EEEEEEi,
  "_ZN6tflite8resource37CreateHashtableResourceIfNotAvailableEPNSt3__213carte_non_ordonnéeIiNS1_10ptr_uniqueINS0_12ResourceBaseENS1_14suppression_par_défautIS4_EEEENS1_4hashIiEENS1_8égal_àIiEENS1_9allocateurINS1_4paireIKiS7_EEEEEEi10TfLiteTypeSJ_": __ZN6tflite8resource37CreateHashtableResourceIfNotAvailableEPNSt3__213carte_non_ordonnéeIiNS1_10ptr_uniqueINS0_12Base_de_ressourcesENS1_14suppression_par_défautIS4_EEEENS1_4hachageIiEENS1_8égal_àIiEENS1_9allocateurINS1_4paireIKiS7_EEEEEEi10TfLiteTypeSJ_,
  "__assert_fail": ___assert_fail,
  "__cxa_allocate_exception": ___cxa_allocate_exception,
  "__cxa_throw": ___cxa_throw,
  "_dlopen_js": __dlopen_js,
  "_dlsym_js": __dlsym_js,
  "_embind_register_bigint": __embind_register_bigint,
  "_embind_register_bool": __embind_register_bool,
  "_embind_register_class": __embind_register_class,
  "_embind_register_class_constructor": __embind_register_class_constructor,
  "_embind_register_class_function": __embind_register_class_function,
  "_embind_register_class_property": __embind_register_class_property,
  "_embind_register_emval": __embind_register_emval,
  "_embind_register_float": __embind_register_float,
  "_embind_register_function": __embind_register_function,
  "_embind_register_integer": __embind_register_integer,
  "_embind_register_memory_view": __embind_register_memory_view,
  "_embind_register_std_string": __embind_register_std_string,
  "_embind_register_std_wstring": __embind_register_std_wstring,
  "_embind_register_void": __embind_register_void,
  "_emscripten_date_now": __emscripten_date_now,
  "_emscripten_get_now_is_monotonic": __emscripten_get_now_is_monotonic,
  "_emval_decref": __emval_decref,
  "_emval_incref": __emval_incref,
  "_emval_take_value": __emval_take_value,
  "_mmap_js": __mmap_js,
  "_munmap_js": __munmap_js,
  "abort": _abort,
  "emscripten_console_error": _emscripten_console_error,
  "emscripten_get_heap_max": _emscripten_get_heap_max,
  "emscripten_get_now": _emscripten_get_now,
  "emscripten_memcpy_big": _emscripten_memcpy_big,
  "emscripten_resize_heap": _emscripten_resize_heap,
  "environ_get": _environ_get,
  "environ_sizes_get": _environ_sizes_get,
  "sortie": _sortie,
  "fd_close": _fd_close,
  "fd_read": _fd_read,
  "fd_seek": _fd_seek,
  "fd_write": _fd_write,
  "getentropy": _getentropy,
  "setTempRet0": _setTempRet0,
  "xnnLoadWasmModuleJS": xnnLoadWasmModuleJS
};
var asm = createWasm();
/** @type {fonction(...*):?} */
var ___wasm_call_ctors = Module["___wasm_call_ctors"] = createExportWrapper("__wasm_call_ctors");

/** @type {fonction(...*):?} */
var _malloc = Module["_malloc"] = createExportWrapper("malloc");

/** @type {fonction(...*):?} */
var _free = Module["_free"] = createExportWrapper("free");

/** @type {fonction(...*):?} */
var ___errno_location = Module["___errno_location"] = createExportWrapper("__errno_location");

/** @type {fonction(...*):?} */
var ___getTypeName = Module["___getTypeName"] = createExportWrapper("__getTypeName");

/** @type {fonction(...*):?} */
var ___embind_register_natif_et_types_intégrés = Module["___embind_register_natif_et_types_intégrés"] = createExportWrapper("__embind_register_natif_et_types_intégrés");

/** @type {fonction(...*):?} */
var ___stdio_exit = Module["___stdio_exit"] = createExportWrapper("__stdio_exit");

/** @type {fonction(...*):?} */
var ___dl_seterr = Module["___dl_seterr"] = createExportWrapper("__dl_seterr");

/** @type {fonction(...*):?} */
var _emscripten_builtin_memalign = Module["_emscripten_builtin_memalign"] = createExportWrapper("emscripten_builtin_memalign");

/** @type {fonction(...*):?} */
var _emscripten_stack_init = Module["_emscripten_stack_init"] = fonction() {
  return (_emscripten_stack_init = Module["_emscripten_stack_init"] = Module["asm"]["emscripten_stack_init"]).apply(null, arguments);
};

/** @type {fonction(...*):?} */
var _emscripten_stack_get_free = Module["_emscripten_stack_get_free"] = fonction() {
  return (_emscripten_stack_get_free = Module["_emscripten_stack_get_free"] = Module["asm"]["emscripten_stack_get_free"]).apply(null, arguments);
};

/** @type {fonction(...*):?} */
var _emscripten_stack_get_base = Module["_emscripten_stack_get_base"] = fonction() {
  return (_emscripten_stack_get_base = Module["_emscripten_stack_get_base"] = Module["asm"]["emscripten_stack_get_base"]).apply(null, arguments);
};

/** @type {fonction(...*):?} */
var _emscripten_stack_get_end = Module["_emscripten_stack_get_end"] = fonction() {
  return (_emscripten_stack_get_end = Module["_emscripten_stack_get_end"] = Module["asm"]["emscripten_stack_get_end"]).apply(null, arguments);
};

/** @type {fonction(...*):?} */
var stackSave = Module["stackSave"] = createExportWrapper("stackSave");

/** @type {fonction(...*):?} */
var stackRestore = Module["stackRestore"] = createExportWrapper("stackRestore");

/** @type {fonction(...*):?} */
var stackAlloc = Module["stackAlloc"] = createExportWrapper("stackAlloc");

/** @type {fonction(...*):?} */
var dynCall_iiiijj = Module["dynCall_iiiijj"] = createExportWrapper("dynCall_iiiijj");

/** @type {fonction(...*):?} */
var dynCall_viijj = Module["dynCall_viijj"] = createExportWrapper("dynCall_viijj");

/** @type {fonction(...*):?} */
var dynCall_viiijjj = Module["dynCall_viiijjj"] = createExportWrapper("dynCall_viiijjj");

/** @type {fonction(...*):?} */
var dynCall_jjj = Module["dynCall_jjj"] = createExportWrapper("dynCall_jjj");

/** @type {fonction(...*):?} */
var dynCall_jiji = Module["dynCall_jiji"] = createExportWrapper("dynCall_jiji");





// === Entrée de configuration de postambule générée automatiquement ===

Fonction d'exécution non exportée ('intArrayFromString', false);
Fonction d'exécution non exportée ('intArrayToString', false);
non exportéRuntimeFunction('ccall', false);
non exportéRuntimeFunction('cwrap', false);
non exportéRuntimeFunction('setValue', false);
non exportéRuntimeFunction('getValue', false);
unexportedRuntimeFunction('allouer', false);
Fonction d'exécution non exportée ('UTF8ArrayToString', false);
Fonction d'exécution non exportée ('UTF8ToString', false);
unexportedRuntimeFunction('stringToUTF8Array', false);
non exportéRuntimeFunction('stringToUTF8', false);
unexportedRuntimeFunction('lengthBytesUTF8', false);
Fonction d'exécution non exportée ('stackTrace', false);
unexportedRuntimeFunction('addOnPreRun', false);
unexportedRuntimeFunction('addOnInit', false);
unexportedRuntimeFunction('addOnPreMain', false);
unexportedRuntimeFunction('addOnExit', false);
unexportedRuntimeFunction('addOnPostRun', false);
Fonction d'exécution non exportée ('writeStringToMemory', false);
Fonction d'exécution non exportée ('writeArrayToMemory', false);
Fonction d'exécution non exportée ('writeAsciiToMemory', false);
Fonction d'exécution non exportée ('addRunDependency', true);
Fonction d'exécution non exportée ('removeRunDependency', true);
Fonction d'exécution non exportée ('FS_createFolder', false);
Fonction d'exécution non exportée ('FS_createPath', true);
Fonction d'exécution non exportée ('FS_createDataFile', true);
Fonction d'exécution non exportée ('FS_createPreloadedFile', true);
Fonction d'exécution non exportée ('FS_createLazyFile', true);
Fonction d'exécution non exportée ('FS_createLink', false);
Fonction d'exécution non exportée ('FS_createDevice', true);
unexportedRuntimeFunction('FS_unlink', vrai);
non exportéRuntimeFunction('getLEB', false);
Fonction d'exécution non exportée ('getFunctionTables', false);
non exportéRuntimeFunction('alignFunctionTables', false);
unexportedRuntimeFunction('registerFunctions', false);
non exportéRuntimeFunction('addFunction', false);
unexportedRuntimeFunction('removeFunction', false);
non exportéRuntimeFunction('getFuncWrapper', false);
unexportedRuntimeFunction('prettyPrint', false);
unexportedRuntimeFunction('dynCall', false);
Fonction d'exécution non exportée ('getCompilerSetting', false);
unexportedRuntimeFunction('print', false);
Fonction d'exécution non exportée ('printErr', false);
non exportéRuntimeFunction('getTempRet0', false);
non exportéRuntimeFunction('setTempRet0', false);
unexportedRuntimeFunction('callMain', false);
unexportedRuntimeFunction('abort', false);
unexportedRuntimeFunction('keepRuntimeAlive', false);
unexportedRuntimeFunction('zeroMemory', false);
non exportéRuntimeFunction('stringToNewUTF8', false);
Fonction d'exécution non exportée ('emscripten_realloc_buffer', false);
non exportéRuntimeFunction('ENV', false);
unexportedRuntimeFunction('ERRNO_CODES', false);
unexportedRuntimeFunction('ERRNO_MESSAGES', false);
Fonction d'exécution non exportée ('setErrNo', false);
unexportedRuntimeFunction('inetPton4', false);
unexportedRuntimeFunction('inetNtop4', false);
unexportedRuntimeFunction('inetPton6', false);
unexportedRuntimeFunction('inetNtop6', false);
Fonction d'exécution non exportée ('readSockaddr', false);
Fonction d'exécution non exportée ('writeSockaddr', false);
non exportéRuntimeFunction('DNS', false);
Fonction d'exécution non exportée ('getHostByName', false);
unexportedRuntimeFunction('Protocoles', false);
non exportéRuntimeFunction('Sockets', false);
unexportedRuntimeFunction('getRandomDevice', false);
unexportedRuntimeFunction('traverseStack', false);
unexportedRuntimeFunction('UNWIND_CACHE', false);
unexportedRuntimeFunction('convertPCtoSourceLocation', false);
Fonction d'exécution non exportée ('readAsmConstArgsArray', false);
Fonction d'exécution non exportée ('readAsmConstArgs', false);
Fonction d'exécution non exportée ('mainThreadEM_ASM', false);
Fonction d'exécution non exportée ('jstoi_q', false);
non exportéRuntimeFunction('jstoi_s', false);
Fonction d'exécution non exportée ('getExecutableName', false);
unexportedRuntimeFunction('listenOnce', false);
unexportedRuntimeFunction('autoResumeAudioContext', false);
Fonction d'exécution non exportée ('dynCallLegacy', false);
unexportedRuntimeFunction('getDynCaller', false);
unexportedRuntimeFunction('dynCall', false);
non exportéRuntimeFunction('setWasmTableEntry', false);
non exportéRuntimeFunction('getWasmTableEntry', false);
unexportedRuntimeFunction('handleException', false);
non exportéRuntimeFunction('runtimeKeepalivePush', false);
non exportéRuntimeFunction('runtimeKeepalivePop', false);
unexportedRuntimeFunction('callUserCallback', false);
unexportedRuntimeFunction('maybeExit', false);
unexportedRuntimeFunction('safeSetTimeout', false);
Fonction d'exécution non exportée ('asmjsMangle', false);
Fonction d'exécution non exportée ('asyncLoad', false);
unexportedRuntimeFunction('alignMemory', false);
non exportéRuntimeFunction('mmapAlloc', false);
unexportedRuntimeFunction('reallyNegative', false);
unexportedRuntimeFunction('unSign', false);
unexportedRuntimeFunction('reSign', false);
unexportedRuntimeFunction('formatString', false);
unexportedRuntimeFunction('CHEMIN', faux);
unexportedRuntimeFunction('PATH_FS', false);
Fonction d'exécution non exportée ('SYSCALLS', false);
Fonction d'exécution non exportée ('getSocketFromFD', false);
Fonction d'exécution non exportée ('getSocketAddress', false);
Fonction d'exécution non exportée ('JSEvents', false);
unexportedRuntimeFunction('registerKeyEventCallback', false);
unexportedRuntimeFunction('specialHTMLTargets', false);
unexportedRuntimeFunction('maybeCStringToJsString', false);
unexportedRuntimeFunction('findEventTarget', false);
unexportedRuntimeFunction('findCanvasEventTarget', false);
unexportedRuntimeFunction('getBoundingClientRect', false);
unexportedRuntimeFunction('fillMouseEventData', false);
unexportedRuntimeFunction('registerMouseEventCallback', false);
unexportedRuntimeFunction('registerWheelEventCallback', false);
unexportedRuntimeFunction('registerUiEventCallback', false);
unexportedRuntimeFunction('registerFocusEventCallback', false);
unexportedRuntimeFunction('fillDeviceOrientationEventData', false);
unexportedRuntimeFunction('registerDeviceOrientationEventCallback', false);
unexportedRuntimeFunction('fillDeviceMotionEventData', false);
unexportedRuntimeFunction('registerDeviceMotionEventCallback', false);
unexportedRuntimeFunction('screenOrientation', false);
unexportedRuntimeFunction('fillOrientationChangeEventData', false);
unexportedRuntimeFunction('registerOrientationChangeEventCallback', false);
unexportedRuntimeFunction('fillFullscreenChangeEventData', false);
unexportedRuntimeFunction('registerFullscreenChangeEventCallback', false);
unexportedRuntimeFunction('registerRestoreOldStyle', false);
unexportedRuntimeFunction('hideEverythingExceptGivenElement', false);
unexportedRuntimeFunction('restoreHiddenElements', false);
unexportedRuntimeFunction('setLetterbox', false);
Fonction d'exécution non exportée ('currentFullscreenStrategy', false);
unexportedRuntimeFunction('restoreOldWindowedStyle', false);
unexportedRuntimeFunction('softFullscreenResizeWebGLRenderTarget', false);
unexportedRuntimeFunction('doRequestFullscreen', false);
unexportedRuntimeFunction('fillPointerlockChangeEventData', false);
unexportedRuntimeFunction('registerPointerlockChangeEventCallback', false);
unexportedRuntimeFunction('registerPointerlockErrorEventCallback', false);
unexportedRuntimeFunction('requestPointerLock', false);
unexportedRuntimeFunction('fillVisibilityChangeEventData', false);
unexportedRuntimeFunction('registerVisibilityChangeEventCallback', false);
unexportedRuntimeFunction('registerTouchEventCallback', false);
unexportedRuntimeFunction('fillGamepadEventData', false);
unexportedRuntimeFunction('registerGamepadEventCallback', false);
unexportedRuntimeFunction('registerBeforeUnloadEventCallback', false);
unexportedRuntimeFunction('fillBatteryEventData', false);
unexportedRuntimeFunction('batterie', false);
unexportedRuntimeFunction('registerBatteryEventCallback', false);
non exportéRuntimeFunction('setCanvasElementSize', false);
Fonction d'exécution non exportée ('getCanvasElementSize', false);
unexportedRuntimeFunction('demangle', false);
unexportedRuntimeFunction('demangleAll', false);
non exportéRuntimeFunction('jsStackTrace', false);
Fonction d'exécution non exportée ('stackTrace', false);
Fonction d'exécution non exportée ('getEnvStrings', false);
unexportedRuntimeFunction('checkWasiClock', false);
non exportéRuntimeFunction('writeI53ToI64', faux);
Fonction d'exécution non exportée ('writeI53ToI64Clamped', false);
Fonction d'exécution non exportée ('writeI53ToI64Signaling', false);
Fonction d'exécution non exportée ('writeI53ToU64Clamped', false);
Fonction d'exécution non exportée ('writeI53ToU64Signaling', false);
Fonction d'exécution non exportée ('readI53FromI64', false);
Fonction d'exécution non exportée ('readI53FromU64', false);
unexportedRuntimeFunction('convertI32PairToI53', false);
unexportedRuntimeFunction('convertU32PairToI53', false);
unexportedRuntimeFunction('setImmediateWrapped', false);
unexportedRuntimeFunction('clearImmediateWrapped', false);
non exportéRuntimeFunction('polyfillSetImmediate', false);
unexportedRuntimeFunction('uncaughtExceptionCount', faux);
unexportedRuntimeFunction('exceptionLast', false);
unexportedRuntimeFunction('exceptionCaught', false);
unexportedRuntimeFunction('ExceptionInfo', false);
unexportedRuntimeFunction('CatchInfo', false);
unexportedRuntimeFunction('exception_addRef', false);
unexportedRuntimeFunction('exception_decRef', false);
unexportedRuntimeFunction('Navigateur', false);
Fonction d'exécution non exportée ('funcWrappers', false);
non exporté tedRuntimeFunction('getFuncWrapper', false);
Fonction d'exécution non exportée ('setMainLoop', false);
non exportéRuntimeFunction('wget', false);
non exportéRuntimeFunction('FS', false);
non exportéRuntimeFunction('MEMFS', false);
unexportedRuntimeFunction('TTY', false);
Fonction d'exécution non exportée ('PIPEFS', false);
Fonction d'exécution non exportée ('SOCKFS', false);
unexportedRuntimeFunction('_setNetworkCallback', false);
Fonction d'exécution non exportée ('tempFixedLengthArray', false);
Fonction d'exécution non exportée ('miniTempWebGLFloatBuffers', false);
unexportedRuntimeFunction('heapObjectForWebGLType', false);
Fonction d'exécution non exportée ('heapAccessShiftForWebGLHeap', false);
non exportéRuntimeFunction('GL', false);
unexportedRuntimeFunction('emscriptenWebGLGet', false);
unexportedRuntimeFunction('computeUnpackAlignedImageSize', false);
Fonction d'exécution non exportée ('emscriptenWebGLGetTexPixelData', false);
unexportedRuntimeFunction('emscriptenWebGLGetUniform', false);
unexportedRuntimeFunction('webglGetUniformLocation', false);
Fonction d'exécution non exportée ('webglPrepareUniformLocationsBeforeFirstUse', false);
unexportedRuntimeFunction('webglGetLeftBracePos', false);
unexportedRuntimeFunction('emscriptenWebGLGetVertexAttrib', false);
Fonction d'exécution non exportée ('writeGLArray', false);
non exportéRuntimeFunction('AL', false);
unexportedRuntimeFunction('SDL_unicode', false);
unexportedRuntimeFunction('SDL_ttfContext', false);
Fonction d'exécution non exportée ('SDL_audio', false);
non exportéRuntimeFunction('SDL', false);
Fonction d'exécution non exportée ('SDL_gfx', false);
unexportedRuntimeFunction('GLUT', false);
non exportéRuntimeFunction('EGL', false);
unexportedRuntimeFunction('GLFW_Window', false);
non exportéRuntimeFunction('GLFW', false);
Fonction d'exécution non exportée ('GLEW', false);
unexportedRuntimeFunction('IDBStore', faux);
Fonction d'exécution non exportée ('runAndAbortIfError', false);
unexportedRuntimeFunction('InternalError', false);
unexportedRuntimeFunction('Erreur de liaison', faux);
unexportedRuntimeFunction('UnboundTypeError', false);
unexportedRuntimeFunction('PureVirtualError', false);
Fonction d'exécution non exportée ('init_embind', false);
unexportedRuntimeFunction('throwInternalError', false);
unexportedRuntimeFunction('throwBindingError', false);
unexportedRuntimeFunction('throwUnboundTypeError', false);
unexportedRuntimeFunction('ensureOverloadTable', false);
unexportedRuntimeFunction('exposePublicSymbol', false);
unexportedRuntimeFunction('replacePublicSymbol', false);
unexportedRuntimeFunction('extendError', false);
unexportedRuntimeFunction('createNamedFunction', false);
unexportedRuntimeFunction('instances enregistrées', false);
unexportedRuntimeFunction('getBasestPointer', false);
unexportedRuntimeFunction('registerInheritedInstance', false);
unexportedRuntimeFunction('unregisterInheritedInstance', false);
Fonction d'exécution non exportée ('getInheritedInstance', false);
Fonction d'exécution non exportée ('getInheritedInstanceCount', false);
Fonction d'exécution non exportée ('getLiveInheritedInstances', false);
unexportedRuntimeFunction('registeredTypes', false);
unexportedRuntimeFunction('en attente de dépendances', faux);
unexportedRuntimeFunction('typeDependencies', false);
unexportedRuntimeFunction('registeredPointers', false);
unexportedRuntimeFunction('registerType', false);
unexportedRuntimeFunction('quand les types dépendants sont résolus', false);
Fonction d'exécution non exportée ('embind_charCodes', false);
Fonction d'exécution non exportée ('embind_init_charCodes', false);
unexportedRuntimeFunction('readLatin1String', false);
Fonction d'exécution non exportée ('getTypeName', false);
Fonction d'exécution non exportée ('heap32VectorToArray', false);
unexportedRuntimeFunction('requireRegisteredType', false);
Fonction d'exécution non exportée ('getShiftFromSize', false);
unexportedRuntimeFunction('integerReadValueFromPointer', false);
Fonction d'exécution non exportée ('enumReadValueFromPointer', false);
Fonction d'exécution non exportée ('floatReadValueFromPointer', false);
Fonction d'exécution non exportée ('simpleReadValueFromPointer', false);
non exportéRuntimeFunction('runDestructors', false);
unexportedRuntimeFunction('nouveau_', faux);
non exportéRuntimeFunction('craftInvokerFunction', false);
unexportedRuntimeFunction('embind__requireFunction', false);
unexportedRuntimeFunction('tupleRegistrations', false);
Fonction d'exécution non exportée ('structRegistrations', false);
unexportedRuntimeFunction('genericPointerToWireType', false);
non exportéRuntimeFunction('constNoSmartPtrRawPointerToWireType', false);
unexportedRuntimeFunction('nonConstNoSmartPtrRawPointerToWireType', false);
unexportedRuntimeFunction('init_RegisteredPointer', false);
unexportedRuntimeFunction('RegisteredPointer', false);
unexportedRuntimeFunction('RegisteredPointer_getPointee', false);
unexportedRuntimeFunction('RegisteredPointer_destructor', false);
unexportedRuntimeFunction('RegisteredPointer_deleteObject', faux);
unexportedRuntimeFunction('RegisteredPointer_fromWireType', false);
non exportéRuntimeFunction('runDestructor', false);
unexportedRuntimeFunction('releaseClassHandle', false);
unexportedRuntimeFunction('finalizationRegistry', false);
unexportedRuntimeFunction('detachFinalizer_deps', false);
unexportedRuntimeFunction('detachFinalizer', false);
unexportedRuntimeFunction('attachFinalizer', false);
unexportedRuntimeFunction('makeClassHandle', false);
unexportedRuntimeFunction('init_ClassHandle', false);
unexportedRuntimeFunction('ClassHandle', false);
unexportedRuntimeFunction('ClassHandle_isAliasOf', false);
unexportedRuntimeFunction('throwInstanceAlreadyDeleted', faux);
unexportedRuntimeFunction('ClassHandle_clone', false);
unexportedRuntimeFunction('ClassHandle_delete', false);
unexportedRuntimeFunction('deletionQueue', false);
unexportedRuntimeFunction('ClassHandle_isDeleted', false);
unexportedRuntimeFunction('ClassHandle_deleteLater', false);
unexportedRuntimeFunction('flushPendingDeletes', false);
unexportedRuntimeFunction('delayFunction', false);
non exportéRuntimeFunction('setDelayFunction', false);
unexportedRuntimeFunction('ClasseEnregistrée', false);
unexportedRuntimeFunction('shallowCopyInternalPointer', false);
unexportedRuntimeFunction('downcastPointer', false);
unexportedRuntimeFunction('upcastPointer', false);
unexportedRuntimeFunction('validateThis', false);
non exportéRuntimeFunction('char_0', false);
non exportéRuntimeFunction('char_9', false);
unexportedRuntimeFunction('makeLegalFunctionName', false);
Fonction d'exécution non exportée ('emval_handle_array', false);
Fonction d'exécution non exportée ('emval_free_list', false);
unexportedRuntimeFunction('emval_symbols', false);
unexportedRuntimeFunction('init_emval', false);
Fonction d'exécution non exportée ('count_emval_handles', false);
Fonction d'exécution non exportée ('get_first_emval', false);
Fonction d'exécution non exportée ('getStringOrSymbol', false);
unexportedRuntimeFunction('Emval', false);
unexportedRuntimeFunction('emval_newers', false);
Fonction d'exécution non exportée ('craftEmvalAllocator', false);
Fonction d'exécution non exportée ('emval_get_global', false);
unexportedRuntimeFunction('emval_methodCallers', false);
Fonction d'exécution non exportée ('emval_registeredMethods', false);
unexportedRuntimeFunction('warnOnce', false);
Fonction d'exécution non exportée ('stackSave', false);
Fonction d'exécution non exportée ('stackRestore', false);
Fonction d'exécution non exportée ('stackAlloc', false);
Fonction d'exécution non exportée ('AsciiToString', false);
non exportéRuntimeFunction('stringToAscii', false);
non exportéRuntimeFunction('UTF16ToString', false);
unexportedRuntimeFunction('stringToUTF16', false);
unexportedRuntimeFunction('lengthBytesUTF16', false);
non exportéRuntimeFunction('UTF32ToString', false);
unexportedRuntimeFunction('stringToUTF32', false);
unexportedRuntimeFunction('lengthBytesUTF32', false);
unexportedRuntimeFunction('allocateUTF8', false);
unexportedRuntimeFunction('allocateUTF8OnStack', faux);
Module["writeStackCookie"] = writeStackCookie;
Module["checkStackCookie"] = checkStackCookie;
unexportedRuntimeSymbol('ALLOC_NORMAL', faux);
unexportedRuntimeSymbol('ALLOC_STACK', false);

var appeléRun;

/**
 * @constructeur
 * @this {Statut de sortie}
 */
fonction ExitStatus(état) {
  this.name = "Statut de sortie";
  this.message = "Programme terminé avec exit(" + status + ")";
  ceci.statut = statut;
}

var appeléMain = false;

dépendancesFulfilled = fonction runCaller() {
  // Si run n'a jamais été appelé et que nous devons appeler run (INVOKE_RUN est vrai et Module.noInitialRun n'est pas faux)
  si (!appeléRun) exécuter();
  si (!appeléRun) dependenciesFulfilled = runCaller; // réessayez plus tard, une fois les nouvelles dépendances remplies
};

fonction stackCheckInit() {
  // Ceci est normalement appelé automatiquement pendant __wasm_call_ctors mais doit être
  // obtenez ces valeurs avant même d'exécuter l'un des acteurs, nous l'appelons donc de manière redondante
  // ici.
  // TODO(sbc) : Déplacez writeStackCookie vers le natif pour éviter cela.
  _emscripten_stack_init();
  writeStackCookie();
}

/** @type {fonction(Tableau=)} */
fonction run(args) {
  args = args || arguments_;

  si (runDependencies > 0) {
    retour;
  }

  stackCheckInit();

  pré-exécution();

  // un preRun a ajouté une dépendance, run sera appelé plus tard
  si (runDependencies > 0) {
    retour;
  }

  fonction doRun() {
    // run vient peut-être d'être appelé via des dépendances satisfaites juste dans ce cadre précis,
    // ou pendant que l'heure asynchrone setStatus ci-dessous se produisait
    si (appeléRun) retourne ;
    appeléRun = vrai;
    Module['calledRun'] = vrai;

    si (ABORT) retour ;

    initRuntime();

    si (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();

    assert(!Module['_main'], 'compilé sans main, mais il en existe un. si vous l'avez ajouté depuis JS, utilisez Module["onRuntimeInitialized"]');

    postRun();
  }

  si (Module['setStatus']) {
    Module['setStatus']('En cours d'exécution...');
    setTimeout(fonction() {
      setTimeout(fonction() {
        Module['setStatus']('');
      }, 1);
      exécuter();
    }, 1);
  } autre
  {
    exécuter();
  }
  checkStackCookie();
}
Module['run'] = exécuter;

fonction checkUnflushedContent() {
  // Les paramètres du compilateur ne permettent pas de quitter l'environnement d'exécution, donc le vidage
  // les flux ne sont pas possibles. mais en mode ASSERTIONS on vérifie
  // s'il y avait quelque chose à vider, et si c'est le cas, dites-le à l'utilisateur
  // devrait demander que le runtime soit exécutable.
  // Normalement, nous n'inclurions même pas flush() du tout, mais dans ASSERTIONS
  // nous le faisons juste pour cette vérification, et ici nous voyons s'il y a des
  // contenu à vider, c'est-à-dire que nous vérifions s'il y aurait eu
  // quelque chose qu'une construction non-ASSERTIONS n'aurait pas vu.
  // La façon dont nous vidons les flux dépend du fait que nous soyons dans SYSCALLS_REQUIRE_FILESYSTEM=0
  // mode (qui a sa propre fonction spéciale pour cela ; sinon, tout
  // le code est à l'intérieur de la libc)
  var oldOut = sortie;
  var oldErr = err;
  var a = faux;
  sortie = erreur = (x) => {
    a = vrai;
  }
  essayer { // cela n'a pas d'importance si cela échoue
    ___stdio_exit();
    // également vidé dans la couche JS FS
    ['stdout', 'stderr'].forEach(fonction(nom) {
      var info = FS.analyzePath('/dev/' + nom);
      si (!info) retour;
      var stream = info.objet;
      var rdev = flux.rdev;
      var tty = TTY.ttys[rdev];
      si (tty && tty.output && tty.output.length) {
        a = vrai;
      }
    });
  } attraper(e) {}
  sortie = ancienneSortie;
  err = ancienneErr;
  si (a) {
    warnOnce('les flux stdio contenaient du contenu qui n'avait pas été vidé. vous devez définir EXIT_RUNTIME sur 1 (voir la FAQ), ou vous assurer d'émettre une nouvelle ligne lorsque vous exécutez printf, etc.');
  }
}

/** @param {booléen|nombre=} implicite */
fonction exit(statut, implicite) {
  EXITSTATUS = état;

  vérifier le contenu non rincé();

  // si exit() a été appelé explicitement, avertir l'utilisateur si le runtime n'est pas réellement arrêté
  si (keepRuntimeAlive() && !implicite) {
    var msg = 'le programme est sorti (avec le statut : ' + statut + '), mais EXIT_RUNTIME n'est pas défini, donc l'exécution est interrompue mais sans quitter le runtime ni empêcher une exécution asynchrone ultérieure (construire avec EXIT_RUNTIME=1, si vous voulez un véritable arrêt)';
    erreur(msg);
  }

  procExit(état);
}

fonction procExit(code) {
  EXITSTATUS = code;
  si (!keepRuntimeAlive()) {
    si (Module['onExit']) Module['onExit'](code);
    ABORT = vrai;
  }
  quit_(code, nouveau ExitStatus(code));
}

si (Module['preInit']) {
  si (typeof Module['preInit'] == 'fonction') Module['preInit'] = [Module['preInit']];
  tandis que (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

courir();




