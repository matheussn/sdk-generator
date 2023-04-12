# SDK Generator

## Getting Started

### How to install

To install this package, use the package manager of your choice,
either [npm](http://npmjs.org) or [yarn](https://yarnpkg.com/).
Simply type the following into a terminal window:

```sh
npm install  @matheussn/sdk-gen  --save-dev
```

or

```sh
yarn install  @matheussn/sdk-gen  --save-dev
```

### Usage
To use the SDK Generator, simply run the following command in your terminal:
```sh
npx sdk-gen  --bp <base-path> -o <output-path>
```

### Options

| Option | Description | Default | Required |
| ------ | ----------- | ------- | -------- |
| --bp, --base-path | The basic path to find the schema and apis definition files | | true |
| -o, --output-path | The output path to save the generated files | | true |
| -f | Use this flag if you want the generated files to be divided into folders according to the domain | false | false |
| -r, --ref | Name of the folder where the yaml files with the openApi definitions are found | references | false |
| -s, --schema | Name of the folder where the yaml files with the schema definitions are found | schemas | false |