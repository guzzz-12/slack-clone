export const invitationEmailTemplate = (email: string, workspaceName: string, token: string) => {
  const href = `${process.env.NEXT_PUBLIC_PROJECT_URL!}/invite?token=${token}`;

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
        >
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        >
    
        <style>
          body {
            font-family: "Roboto", sans-serif;
          }
    
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
    
          .template {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 1.5rem;
            width: 100%;
            padding: 2.5rem 1rem;
            background-color: #c7c7c7 !important;
          }
    
          .template__logo {
            text-align: center;
            font-size: 35px;
          }
    
          .template__inner-wrapper {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            padding: 2rem;
            background-color: white;
            border-radius: 5px;
            border: 1px solid rgba(0,0,0,0.3);
          }
    
          .template__title {
            margin-bottom: 10px;
            text-align: center;
            font-size: 22px;
            font-weight: 400;
            color: #464646;
          }

          .template__subtitle {
            margin-bottom: 2rem;
            text-align: center;
            font-size: 16px;
            font-weight: 400;
            color: #464646;
          }
    
          .template__main-text {
            width: 100%;
            margin: 0 auto;
            margin-bottom: 2rem;
            font-size: 16px;
            text-align: center;
            color: #1f1f1f;
          }

          .template__secondary-text {
            text-align: center;
            font-size: 14px;
            color: #6d6d6d;
          }

          .template__secondary-text small {
            display: inline-block;
            margin-top: 1rem;
            text-align: center;
            color: #a1a1a1
          }

          .template__link {
            display: block;
            width: 250px;
            margin: 0 auto;
            margin-bottom: 3rem;
            padding: 1.2rem 1.5rem;
            border: none;
            font-family: inherit;
            font-size: 14px;
            text-decoration: none;
            text-align: center;
            text-transform: uppercase;
            color: white !important;
            background-color: #311834;
            cursor: pointer;
          }
        </style>
    
      </head>
    
      <body>
        <main class="template">
          <h1 class="template__logo">Workspace invitation</h1>

          <section class="template__inner-wrapper">
            <h2 class="template__title">Hello ${email}</h2>

            <p class="template__main-text">
              You have been invited to join ${workspaceName}. <br> Signin to Slack Clone with this email address <br> and follow the link below to join the workspace.
            </p>
            
            <a href=${href} class="template__link" target="__blank">
              Join Workspace
            </a>

            <p class="template__main-text">
              This link will expire in 24 hours.
            </p>

            <div class="template__secondary-text">
              <small>Developed by Jesús Guzmán | ${new Date().getFullYear()} - All rights reserved</small>
            </div>
          </div>
        </div>
      </body>
    </html>
  `
};