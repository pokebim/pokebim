/**
 * Utilidad para el registro de logs en el servidor
 * Centraliza el formato y gestión de logs
 */

// Niveles de log
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

/**
 * Registra un mensaje en la consola del servidor con formato enriquecido
 * 
 * @param service Nombre del servicio o componente que genera el log
 * @param message Mensaje a registrar
 * @param level Nivel de importancia del log
 * @param data Datos adicionales opcionales
 */
export function logToConsole(
  service: string,
  message: string,
  level: LogLevel = 'info',
  data?: any
) {
  const timestamp = new Date().toISOString();
  const formattedService = service.padEnd(20);
  
  let logFn: Function;
  let prefix: string;
  
  switch (level) {
    case 'error':
      logFn = console.error;
      prefix = '❌';
      break;
    case 'warn':
      logFn = console.warn;
      prefix = '⚠️';
      break;
    case 'debug':
      logFn = console.debug;
      prefix = '🔍';
      break;
    case 'info':
    default:
      logFn = console.log;
      prefix = '📝';
      break;
  }
  
  const logMessage = `${prefix} [${timestamp}] [${formattedService}] ${message}`;
  
  if (data) {
    logFn(logMessage, data);
  } else {
    logFn(logMessage);
  }
  
  // Aquí se podría añadir lógica para enviar logs a servicios externos
  // como Sentry, LogRocket, etc. en caso de ser necesario en el futuro
} 