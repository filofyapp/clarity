# Configuración de Servidor para Envío de Emails (VPS)

Dado que no utilizas Vercel (la plataforma de hosting que provee cron jobs integrados), deberás configurar una pequeña tarea automática (CRON) directamente en tu servidor Linux (VPS) para que dispare los envíos de emails cada ciertos minutos.

El envío de emails de Clarity utiliza un sistema asíncrono. Esto significa que cuando tú (o un gestor) cambian de estado un caso, el sistema anota en la base de datos "Guardé un email para enviar". Luego, necesita que "alguien" revise esa cola y despache los correos acumulados usando Gmail. Ese "alguien" es el Cron Job.

Aquí tienes los pasos exactos para configurarlo en tu VPS:

## Paso 1: Entrar a la configuración de Cron
Abre la consola/terminal SSH conectada a tu VPS y escribe el siguiente comando para acceder a la lista de tareas automáticas del servidor:
```bash
crontab -e
```
*(Si te pregunta qué editor usar, presiona el número correspondiente a "nano", suele ser la opción más fácil).*

## Paso 2: Agregar la regla
Ve hasta el final del archivo con las flechas del teclado y pega la siguiente línea. Esta línea le dice al servidor: *"Cada 3 minutos, visita silenciosamente la ruta secreta de procesar mails de Clarity"*:

```bash
*/3 * * * * curl -s -o /dev/null https://tu-dominio.com/api/cron/procesar-mails
```

>**Nota Importante:** Reemplaza `https://tu-dominio.com` por el dominio real o la IP donde tienes alojado Clarity (por ejemplo, `https://clarity.aomnis.com/api/cron/procesar-mails`).

## Paso 3: Guardar y salir
1. Presiona `Ctrl + O` (letra O) y luego `Enter` para **Guardar**.
2. Presiona `Ctrl + X` para **Salir**.

Verás un mensaje que dice `crontab: installing new crontab`. 

¡Con esto ya está listo! Cada 3 minutos justos el VPS gatillará los correos que se hayan encolado en la base de datos de manera automática.
