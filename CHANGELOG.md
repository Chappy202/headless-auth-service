# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="0.3.2"></a>
## [0.3.2](https://github.com/Chappy202/headless-auth-service/compare/v0.3.1...v0.3.2) (2024-09-21)


### :sparkle: Features

* add initial seed data for permissions, roles and resources ([d131ac9](https://github.com/Chappy202/headless-auth-service/commit/d131ac9))
* **admin:** add logic to assign permissions to roles ([ea381c5](https://github.com/Chappy202/headless-auth-service/commit/ea381c5))
* **admin:** add role management and bruno collections ([b3f3127](https://github.com/Chappy202/headless-auth-service/commit/b3f3127))


### Chores

* add dependabot updates ([7b48ac1](https://github.com/Chappy202/headless-auth-service/commit/7b48ac1))
* **deps:** bump axios in the npm_and_yarn group across 1 directory ([6a3d842](https://github.com/Chappy202/headless-auth-service/commit/6a3d842))
* update dependabot to use development branch ([3d13108](https://github.com/Chappy202/headless-auth-service/commit/3d13108))
* update dependabot to use npm instead of yarn ([68558c6](https://github.com/Chappy202/headless-auth-service/commit/68558c6))
* use yarn for dependabot updates ([1d56760](https://github.com/Chappy202/headless-auth-service/commit/1d56760))

<a name="0.3.1"></a>
## [0.3.1](https://github.com/Chappy202/headless-auth-service/compare/v0.3.0...v0.3.1) (2024-09-12)


### :bug: Bug Fixes

* fix super user permission override not working when applied to not super role users ([42be730](https://github.com/Chappy202/headless-auth-service/commit/42be730))


### :sparkle: Features

* add roles and permission details to user details responses ([4d935d6](https://github.com/Chappy202/headless-auth-service/commit/4d935d6))


### :white_check_mark: Tests

* update bruno collections ([9b5f403](https://github.com/Chappy202/headless-auth-service/commit/9b5f403))


### Chores

* add contributing readme ([806dfd8](https://github.com/Chappy202/headless-auth-service/commit/806dfd8))

<a name="0.3.0"></a>
# 0.3.0 (2024-09-12)


### :bug: Bug Fixes

* **admin:** add error handling for invalid user ids on update endpoint ([9bc0e1f](https://github.com/Chappy202/headless-auth-service/commit/9bc0e1f))
* **admin:** fix admin user creation email encryption/decryption ([5a7465d](https://github.com/Chappy202/headless-auth-service/commit/5a7465d))
* **admin:** fix email encryption and decryption on user update ([fee81f5](https://github.com/Chappy202/headless-auth-service/commit/fee81f5))
* **admin:** fix email not being optional on user creation ([ae11b3e](https://github.com/Chappy202/headless-auth-service/commit/ae11b3e))
* **admin:** fix error handling when sending invalid user id in user delete ([63c0b37](https://github.com/Chappy202/headless-auth-service/commit/63c0b37))
* **admin:** fix invalid userId value responses on user details endpoint ([9f8a8bd](https://github.com/Chappy202/headless-auth-service/commit/9f8a8bd))
* **admin:** fix user deletion for users with roles and add default assignment ([a0362c2](https://github.com/Chappy202/headless-auth-service/commit/a0362c2))
* **admin:** fix user email being incorrectly returned on user details ([1461ee9](https://github.com/Chappy202/headless-auth-service/commit/1461ee9))
* **admin:** gracefully handle user unique user constraint error ([38a197f](https://github.com/Chappy202/headless-auth-service/commit/38a197f))
* **admin:** update error handling for invalid id values to be more descriptive ([4c5853e](https://github.com/Chappy202/headless-auth-service/commit/4c5853e))
* **auth:** encrypt user email on registration ([53d5324](https://github.com/Chappy202/headless-auth-service/commit/53d5324))
* **auth:** fix login redis check and update register to return correct message ([8dfccb4](https://github.com/Chappy202/headless-auth-service/commit/8dfccb4))
* **auth:** make email field optional on registration ([e97cdf3](https://github.com/Chappy202/headless-auth-service/commit/e97cdf3))
* fix permission guard permission checking ([201baaf](https://github.com/Chappy202/headless-auth-service/commit/201baaf))
* remove password from user profile data ([de5f912](https://github.com/Chappy202/headless-auth-service/commit/de5f912))
* **user:** fix user profile email being returned incorrectly ([3dd09fc](https://github.com/Chappy202/headless-auth-service/commit/3dd09fc))


### :hammer: Code Refactoring

* clean-up code structure and improve api-key auth logic ([0a90444](https://github.com/Chappy202/headless-auth-service/commit/0a90444))
* improve imports to make use of typescript paths ([be3f8fc](https://github.com/Chappy202/headless-auth-service/commit/be3f8fc))
* move drizzle schema from db folder to drizzle folder ([fb53a61](https://github.com/Chappy202/headless-auth-service/commit/fb53a61))


### :memo: Documentation

* Add basic swagger doc generation endpoint ([e9b8733](https://github.com/Chappy202/headless-auth-service/commit/e9b8733))
* add versioning standards and commit standards ([d9b4840](https://github.com/Chappy202/headless-auth-service/commit/d9b4840))
* update bru register request ([9707dcd](https://github.com/Chappy202/headless-auth-service/commit/9707dcd))
* update readme ([ce283e4](https://github.com/Chappy202/headless-auth-service/commit/ce283e4))
* update swagger generation to include user conflict scenario ([00667f2](https://github.com/Chappy202/headless-auth-service/commit/00667f2))


### :sparkle: Features

* add health checks for essential services and memory ([a292e2b](https://github.com/Chappy202/headless-auth-service/commit/a292e2b))
* **auth:** add api key auth, improve refresh, add backend token validate ([6260c1a](https://github.com/Chappy202/headless-auth-service/commit/6260c1a))
* enhance database flow and user detail encryption ([752f938](https://github.com/Chappy202/headless-auth-service/commit/752f938))
* enhance permission system to be more robust and flexible ([d9a2d25](https://github.com/Chappy202/headless-auth-service/commit/d9a2d25))
* improve super user logic, add initial user on migration run ([a8fbbf2](https://github.com/Chappy202/headless-auth-service/commit/a8fbbf2))
* improve type safety and API documentation - add request throttling ([91f9d7b](https://github.com/Chappy202/headless-auth-service/commit/91f9d7b))
* include permissions in the JWT token ([40ba39b](https://github.com/Chappy202/headless-auth-service/commit/40ba39b))
* initial project files ([4393f1c](https://github.com/Chappy202/headless-auth-service/commit/4393f1c))
* **security:** enable for common security HTTP headers ([c637a91](https://github.com/Chappy202/headless-auth-service/commit/c637a91))
* **security:** enhance user session management and login history ([985546b](https://github.com/Chappy202/headless-auth-service/commit/985546b))
* **security:** increase salt rounds to 12 from 10 ([8bc79da](https://github.com/Chappy202/headless-auth-service/commit/8bc79da))


### :white_check_mark: Tests

* update bruno collections to correctly reflect available endpoints ([15ff4bf](https://github.com/Chappy202/headless-auth-service/commit/15ff4bf))


### :zap: Performance Improvements

* enhance token blacklist logic to use redis cache for better perf ([cd27135](https://github.com/Chappy202/headless-auth-service/commit/cd27135))


### Chores

* **deps:** bump prettier and eslint versions ([a82ec56](https://github.com/Chappy202/headless-auth-service/commit/a82ec56))
* **syntax:** add vscode settings override to force eslint checks ([313d105](https://github.com/Chappy202/headless-auth-service/commit/313d105))
