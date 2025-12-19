## Initial Project

```bash
npx create-next-app@latest
```


√ Would you like to use the recommended Next.js defaults? » No, customize settings
√ Would you like to use TypeScript? ... **No** / Yes
√ Which linter would you like to use? » ESLint
√ Would you like to use React Compiler? ... **No** / Yes
√ Would you like to use Tailwind CSS? ... No / **Yes**
√ Would you like your code inside a `src/` directory? ... **No** / Yes
√ Would you like to use App Router? (recommended) ... No / **Yes**
√ Would you like to customize the import alias (`@/*` by default)? ... **No** / Yes

## Shadcn Design System

```bash
npx shadcn@latest init
```

√ Which color would you like to use as the **base color**? » **Gray**

```bash
npm install next-themes
```

## Auth.js

```bash
npm install next-auth@beta
```

```bash
npx auth secret
```

```text
app/
components/
hooks/
lib/
├─ actions/
│  ├─ auth.js
│  └─ topics.js
├─ auth/
│  ├─ getUserIdOrResult.js
│  └─ index.js
├─ constants/
│  └─ index.js
├─ database/
│  ├─ connection/
│  │    ├─ db.js
│  │    └─ mongoose.js    
|  └─ models/
│       └─ Topic.js
├─ mappers/
│  └─ topic.js
├─ services/
│  └─ topics.service.js
└─ utils.js
```
