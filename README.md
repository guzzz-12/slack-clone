**Descripción del Proyecto**
==========================

Team Flow es un proyecto que busca replicar la funcionalidad de la plataforma de comunicación en equipo Slack. Si bien no cuenta con la totalidad de funciones de Slack comparte sus funciones principales y, en esencia, está diseñado para ser una herramienta de colaboración en línea para equipos de trabajo, permitiendo a los usuarios enviar mensajes, compartir archivos y realizar videollamadas.

**Características**
-------------------

El proyecto incluye las siguientes características:

* **Autenticación**: el proyecto incluye un sistema de autenticación mediante Google, GitHub y magic link.

![Captura de pantalla de la interfaz de autenticación](https://mir-s3-cdn-cf.behance.net/project_modules/source/e050a2222252813.67e2c34a13ca5.png)

* **Sistema de invitaciones**: el administrador de un Workspace puede invitar a otros usuarios a unirse al Workspace mediante un enlace de invitación que se envía a traves de correo electrónico.

![Captura de pantalla de la interfaz de invitación](https://mir-s3-cdn-cf.behance.net/project_modules/source/8469cf222252813.67e2c34a144d4.png)

* **Creación de Workspaces y canales**: los usuarios pueden crear y unirse a workspaces y canales para organizar las conversaciones por tema o proyecto.

![Pantalla para seleccionar un Workspace o crear un nuevo Workspace](https://mir-s3-cdn-cf.behance.net/project_modules/source/d72fb5222252813.67e2c34a1589d.png)

![Captura de pantalla de la interfaz de creación de Workspace](https://mir-s3-cdn-cf.behance.net/project_modules/source/7a3464222252813.67e2c34a1516d.png)

![Captura de pantalla de la interfaz de creación de Workspace](https://mir-s3-cdn-cf.behance.net/project_modules/source/7cfdbf222252813.67e2c34a16378.png)

* **Mensajes grupales y mensajes privados**: los usuarios pueden enviar mensajes de texto y compartir archivos en los canales y de forma privada en chat privados.

![Captura de pantalla de la interfaz de mensajería grupal](https://mir-s3-cdn-cf.behance.net/project_modules/source/8467e5222252813.67e2c34a14acb.png)

* **Canales**: los usuarios pueden crear y unirse a canales en los Workspaces a los que pertenecen para organizar las conversaciones por tema o proyecto.

![Captura de pantalla de la interfaz de creación de un nuevo canal](https://mir-s3-cdn-cf.behance.net/project_modules/source/4f5b60222252813.67e2c34a16a51.png)

* **Videollamadas y conferencias**: los usuarios pueden realizar video conferencias grupales en los canales a los que perteneces y llamadas privadas con otro miembro del equipo.

* **Idiomas**: actualmente la interfaz de usuario del proyecto está en inglés, pero está pendiente la implementación del soporte multilenguaje para otros idiomas.

**Tecnologías Utilizadas**

* **Desarrollo Frontend:**
  * **React, Next.js (App Router) y TypeScript:** Para la creación de la interfaz de usuario adaptable, reactiva y optimizada, así como la API RESTful basada en el App Router de Next.js.
  * **Shadcn UI y Tailwind CSS:** Para la creación de componentes enfocados tanto en la flexibilidad como en la accesibilidad web.
* **Desarrollo Backend y Gestión de APIs:**
  * **API RESTful:** Desarrollada completamente en Next.js (App Router).
  * **Supabase:** Para la gestión de la base de datos PostgreSQL con énfasis en la seguridad mediante políticas Row Level Security y para el manejo de la autenticación de usuarios a través de múltiples proveedores (Google, GitHub, magic link).
* **Almacenamiento en la Nube y Seguridad de Archivos:**
  * **Backblaze:** Integración con servicios de almacenamiento en la nube para la gestión segura y eficiente de los archivos de los usuarios.
* **Comunicación en tiempo real:**
  * **PusherJS:** Para la mensajería en tiempo real.
  * **LiveKit:** Para la creación de videollamadas y conferencias en tiempo real.

**Enlaces**
------------

*   [Demo del Proyecto](https://slack-clone-jg.vercel.app)
*   [Demo en Behance](https://www.behance.net/gallery/222252813/TeamFlow)