# GitHub: destino y cuenta correctos

## Configuración restaurada el 6 de octubre de 2026

El clon apuntaba a un fork creado desde la cuenta de Exsecutor. Se conservaron
todos los archivos y commits, y se renombraron los remotos:

| Remoto | URL | Uso |
|---|---|---|
| `origin` | `https://github.com/davidduranibanez-max/CEAN.git` | Repositorio de David; destino de main |
| `fork-exsecutor` | `https://github.com/exsecutor000-ship-it/CEAN.git` | Referencia al fork anterior |

Antes, el original se llamaba `upstream`. Ahora `main` sigue `origin/main`.
El commit `bcd1215` se conserva. Se consultó el repositorio original: estaba un
commit detrás de main y no contenía cambios adicionales que integrar.
No se ejecutó push ni se borró el fork en GitHub. No fue necesario volver a clonar.
Una copia de la configuración anterior se dejó fuera del repo, en `tmp/git-respaldo`
de la carpeta de trabajo padre.

## Autor y autenticación son distintos

Para **futuros commits**, se configuró localmente:

```sh
git config --local user.name "David Durán Ibáñez"
git config --local user.email "davidduranibanez@gmail.com"
```

El correo fue proporcionado por el usuario. Estos valores no cambian la sesión
GitHub ni reescriben el autor de commits anteriores.

Para seleccionar credenciales de **este repositorio**, se configuró:

```sh
git config --local credential.https://github.com.username davidduranibanez-max
git config --local credential.https://github.com.useHttpPath true
```

No se cambiaron las cuentas ni credenciales globales utilizadas por otros proyectos.
El inicio de sesión sigue siendo necesario y lo realiza el usuario en el navegador.

## Subir desde VS Code o su terminal

1. En VS Code, cambiar la sesión GitHub de Exsecutor a la de David desde Cuentas.
2. En el navegador que abra la autenticación, comprobar que está conectada la cuenta
   **davidduranibanez-max**. Elegir esa cuenta si el gestor ofrece varias.
3. Abrir la carpeta raíz CEAN y ejecutar:

```sh
git remote -v
git status
git push origin main
```

El último comando sube los commits existentes, no los archivos todavía sin commit.
Para cambios posteriores, revisarlos y crear un commit antes de subirlos. No usar
push forzado ni aceptar crear otro fork como solución a un error de cuenta.

Si aparece falta de permisos, verificar primero la cuenta utilizada para autenticar.
El destino correcto se comprueba con `git remote get-url origin`; cambiar
`user.name` o `user.email` por sí solo no soluciona permisos.

## Eliminar el fork es opcional y separado

El clon ya trabaja con el original aunque el fork continúe en GitHub. Si el usuario
decide eliminar la copia remota, debe hacerlo desde la cuenta propietaria del fork,
en su repositorio → Settings → Danger Zone → Delete this repository. El destino
original de David es otro repositorio; distinguir las URLs antes de eliminar.

## Referencias oficiales

- [Gestión de remotos](https://docs.github.com/en/get-started/git-basics/managing-remote-repositories).
- [Cuentas múltiples y credenciales por ruta](https://docs.github.com/en/account-and-profile/how-tos/account-management/managing-multiple-accounts).
- [Identidad de commit frente a credenciales](https://github.com/git-ecosystem/git-credential-manager/blob/main/docs/multiple-users.md).
- [Acceso GitHub en VS Code](https://code.visualstudio.com/docs/sourcecontrol/github).
