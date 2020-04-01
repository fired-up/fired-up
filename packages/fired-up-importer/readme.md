## UI-based importer

The `processAdminImports` function is expected to be used in conjunction with the Fired Up admin panel and the importer functionality there.

## CLI Importer

The Fired Up CLI importer can import a variety of data into the databases. It currently can import CSV files. The file is lightly validated before being pushed up to Google's servers where the imported rows will be saved as signups in Firestore and then synced to BigQuery. Similar to how a Person record is created when a user signs up on the website, a Person record will be created or updated when their imported row is uploaded.

### Requirements

- [Modern version of Node.js](https://nodejs.org/en/) (>=10)
- [Yarn Package Manager](https://yarnpkg.com/en/)
- Some friendliness with the CLI.
- Google Cloud IAM permissions to encrypt/decrypt KMS keys.
  - Contact a team member if you do not have appropriate permissions.

### Initial setup

- Run `yarn` to install required Node.js packages
- If you to not have current decrypted keys in the root of the repo (`key-firedup-dev.json` and/or `key-firedup-prod.json`), run `yarn decrypt` to get or update your keys.
  - If decryption fails, please ask your GCP administrator to set your KMS permissions.

### CSV Data Changes

- Currently, the only required field is `email_address`
- Currently, your CSV must use Fired Up field names as column headers. In the future, preset functionality will remove this requirement. The column naming convention is as follows:
  - `given_name` First Name
  - `family_name` Last Name
  - `locality` City
  - `region` State
  - `email_address` Email Address
  - `address_line1` Address Line 1
  - `address_line2` Address Line 2
  - `postal_code` Zip Code
  - `phone_number` Phone Number
  - `honorific_prefix` Prefix before name (eg: Mr, Miss, Dr)
  - `honorific_suffix` Suffix after name (eg: III, IV)
  - `employer` Employer
  - `occupation` Occupation
  - `created_at` Date the signup occured
- If a `created_at` field is supplied, it must be a valid [ISO 8601 formatted date](https://en.wikipedia.org/wiki/ISO_8601). You can use Google Sheets or Excel to convert the format of this column to `YYYY-MM-DD`.

### Usage

The importer has a variety of arguments to control functionality.

- `--input` path to the CSV file.
- `--project` name of the project you want to import to
  - currently we only support `firedup-prod` and `firedup-dev`
- `--create-users` will create a Fired Up user, which may deploy to other places depending on the fired up configuration
- `--create-volunteers` will create Fired Up users AND flag them as volunteers, which results in being associated with an organizer in Intercom. This takes precedence over --create-users.

`node index.js --project=firedup-prod --input=input/example.csv --create-users`

- `--utm_campaign`
- `--utm_medium`
- `--utm_content`
- `--utm_source`
- `--utm_term` UTM paramaters for every imported row in the CSV can be set via these arguments.

`node index.js --project=firedup-prod --input=input/example.csv --utm_campaign=my_campaign --utm_medium=my_medium --utm_content=my_content --utm_source=my_source --utm_term=my_term`

### Updating Service Account Keys

If we need to use a new service account key you can get the appropriate service account key(s) from the IAM dashboard and save them into the root of this repo (not in this subfolder). They should be in the format of `key-[project-id].json`.

Currently we only have keys for `firedup-prod` and `firedup-dev` projects.

Then, from this directory, run `yarn encrypt:all`, `yarn encrypt:prod`, or `yarn encrypt:dev` PRIOR to running `yarn (install)` and the appropriate keys will be encrypted.
