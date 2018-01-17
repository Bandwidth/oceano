# ⚠️ DEPRECATED⚠️ 

## oceano
[![Build](https://travis-ci.org/bandwidthcom/oceano.png)](https://travis-ci.org/bandwidthcom/oceano)
[![Dependencies](https://david-dm.org/bandwidthcom/oceano.png)](https://david-dm.org/bandwidthcom/oceano)


Digital Ocean hosting provider for service_maker

## Install

```
npm install oceano
```
and then use this plugin from code like

```
yield server.register(require("oceano"));
```

or from  manifest file

```
"plugins":{
   "oceano": {}
}
```

Also you can use yeoman generator to install this plugin

```
yo co-hapi:add-plugin oceano
```

## Parameters

Credentials: clientId*, apiKey*.
Options: name*, sizeId,  sizeSlug, imageId, imageSlug, regionId, regionSlug, sshKeyIds, privateNetworking, backupsEnabled

Options with star (*) are required.

## Example

```
 $ sm_cli service-create host:oceano -c clientId=id -c apiKey=key -o name=MyDroplet
```

