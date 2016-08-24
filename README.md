# crudl django example
DISCLAIMER: This is a preliminary, sketchy and incomplete documentation. This example mainly shows how to use CRUDL. It is not intended for development on CRUDL itself.

## TOC
* [About](#about)
* [Requirements](#requirements)
* [Installation](#installation)
* [Notes](#notes)
    * [Connectors and Descriptors](#connectors-and-descriptors)
    * [Authentication](#authentication)
    * [Field dependency](#field-dependency)
    * [Foreign Key, Many-to-Many](#foreign-key-many-to-many)
    * [Relation with different endpoint](#relation-with-different-endpoint)
    * [Normalize/denormalize](#normalizedenormalize)
    * [Custom components](#custom-components)
    * [Initial values](#initial-values)
    * [Validate fields and form](#validate-fields-and-form)
    * [Custom column with listView](#custom-column-with-listview)
    * [Multiple sort with listView](#multiple-sort-with-listview)
    * [Filtering with listView](#filtering-with-listview)
    * [Change password](#change-password)
* [Limitations](#limitations)
* [Credits & Links](#credits--links)

## About
This is a [CRUDL](http://crudl.io/) example with [Django](https://www.djangoproject.com/) and [DRF](http://www.django-rest-framework.org/) for the REST-API as well as [Graphene](http://graphene-python.org/) for GraphQL.

* CRUDL is still under development and the syntax might change (esp. with connectors and descriptors).
* The relevant part for your admin interface is within the folder crudl-admin-rest/admin/ (resp. crudl-admin-graphql/admin/). All other files and folders are usually given when using CRUDL.
* The collections are intentionally verbose in order to illustrate the possibilites with CRUDL.

## Requirements
* Node.js
* python
* virtualenv
* SQLite

## Installation
1. Create and activate a python virtual environment.

    ```shell
    $ virtualenv crudlexample
    $ source crudlexample/bin/activate
    ```

2. Clone this repository and cd into the new folder:

    ```shell
    (crudlexample) $ git clone https://github.com/crudlio/crudl-example-django.git
    (crudlexample) $ cd crudl-example-django
    ```

3. Install the python requirements:

    ```shell
    (crudlexample) crudl-example-django $ pip install -r conf/requirements.txt
    ```

4. Setup the database (SQLite) and add contents:

    ```shell
    (crudlexample) crudl-example-django $ python manage.py migrate
    (crudlexample) crudl-example-django $ python manage.py loaddata apps/blog/fixtures/blog.json
    ```

5. Install the Node.js dependencies and build/watch the crudl admin file. Go to either /crudl-admin-rest/ or /crudl-admin-graphql/ and type:

    ```shell
    (crudlexample) crudl-admin-rest $ npm install
    (crudlexample) crudl-admin-rest $ npm run watchify
    ```

6. Start the django development server:

    ```shell
    (crudlexample) crudl-example-django $ python manage.py runserver
    ```

Open your browser and go to either ``http://localhost:8000/crudl-rest/`` or ``http://localhost:8000/crudl-graphql/`` and login with the demo user (demo/demo).

## Notes
While this example is simple, there's still a couple of more advanced features in order to represent a real-world scenario.

### Connectors and Descriptors
In order for CRUDL to work, you need to define _connectors_ (API endpoints) and a _descriptor_ (visual representation). The _descriptor_ mainly consists of _collections_ and the _authentification_.

Here is the basic structure of a REST connector:
```javascript
{
    id: 'entries',
    url: 'entries/',
    pagination: numberedPagination,
    transform: {
        readResponseData: data => data.results
    },
},
```

And here is a similar connector with GraphQL:
```javascript
{
    id: 'entries',
    query: {
        read: `{allEntries{id, title, status, date}}`,
    },
    pagination: continuousPagination,
    transform: {
        readResponseData: data => data.data.allEntries.edges.map(e => e.node)
    },
},
```

With collections, you create the visual representation by defining the _listView_, _changeView_ and _addView_ of each object:
```javascript
var listView = {}
listView.fields = []
listView.filters = []
var changeView = {}
changeView.fields = []
changeView.tabs = []
var addView = {}
```

### Authentication
Both the REST and GraphQL API is only accessible for logged-in users based on TokenAuthentication. Besides the Token, we also return an attribute _info_ in order to subsequently have access to the currently logged-in user (e.g. for filtering). The _info_ is exposed in the global variable `crudl.auth`.

```javascript
{
    id: 'login',
    url: '/rest-api/login/',
    mapping: { read: 'post', },
    transform: {
        readResponseData: data => ({
            requestHeaders: { 'Authorization': `Token ${data.token}` },
            info: data,
        })
    }
}
```

### Field dependency
With _Entries_, the _Categories_ depend on the selected _Section_. If you change the field _Section_, the options of field _Category_ are populated based on the chosen _Section_ due to the _onChange_ method.

```javascript
{
    name: 'category',
    field: 'Autocomplete',
    onChange: [
        {
            in: 'section',
            setProps: (section) => {
                if (!section.value) {
                    return {
                        readOnly: true,
                        helpText: 'In order to select a category, you have to select a section first',
                    }
                }
                return crudl.connectors.categories_options.read(crudl.req()
                .filter('section', section.value))
                .then(res => {
                    return {
                        readOnly: false,
                        helpText: 'Select a category',
                        ...res.data,
                    }
                })
            }
        }
    ],
}
```

You can use the same syntax with list filters (see entries.js).

### Foreign Key, Many-to-Many
There are a couple of foreign keys being used (e.g. _Section_ or _Category_ with _Entry_) and one many-to-many field (_Tags_ with _Entry_).

```javascript
{
    name: 'section',
    label: 'Section',
    field: 'Select',
    props: () => crudl.connectors.sections_options.read(crudl.req()).then(res => res.data),
},
{
    name: 'category',
    label: 'Category',
    field: 'Autocomplete',
    actions: {
        select: (req) => {
            return crudl.connectors.categories_options.read(req
            .filter('id_in', req.data.selection.map(item => item.value).toString()))
            .then(res => res.setData(res.data.options))
        },
        search: (req) => {
            return crudl.connectors.categories_options.read(req
            .filter('name', req.data.query)
            .filter('section', crudl.context.data.section))
            .then(res => res.setData(res.data.options))
        },
    },
},
{
    name: 'tags',
    label: 'Tags',
    field: 'AutocompleteMultiple',
    actions: {},
}
```

### Relation with different endpoint
The collection _Links_ is an example of related objects which are assigned through an intermediary table with additional fields.

```javascript
changeView.tabs = [
    {
        title: 'Links',
        actions: {
            list: (req) => crudl.connectors.links.read(req.filter('entry', crudl.path.id)),
            add: (req) => crudl.connectors.links.create(req),
            save: (req) => crudl.connectors.link(req.data.id).update(req),
            delete: (req) => crudl.connectors.link(req.data.id).delete(req)
        },
        itemTitle: '{url}',
        fields: [
            {
                name: 'url',
                label: 'URL',
                field: 'URL',
                props: {
                    link: true,
                },
            },
            {
                name: 'title',
                label: 'Title',
                field: 'String',
            },
            {
                name: 'id',
                field: 'hidden',
            },
            {
                name: 'entry',
                field: 'hidden',
                initialValue: () => crudl.context.data.id,
            },
        ],
    },
]
```

### Normalize/denormalize
With _Entries_, we set the owner to the currently logged-in user with denormalize:

```javascript
var addView = {
    denormalize: (data) => {
        /* set owner on add. alternatively, we could manipulate the data
        with the connector by using createRequestData */
        if (crudl.auth.user) data.owner = crudl.auth.user
        return data
    }
}
```

With _Users_, we add a custom column full_name with the listView:

```javascript
var listView = {
    normalize: (list) => list.map(item => {
        item.full_name = <span><b>{item.last_name}</b>, {item.first_name}</span>
        return item
    })
}
```

### Custom components
We have added a custom component _SplitDateTimeField.jsx_ (see admin/fields) in order to show how you're able to implement fields which are not part of the core package.

```javascript
import options from './admin/options'
import descriptor from './admin/descriptor'
import SplitDateTimeField from './admin/fields/SplitDateTimeField'

crudl.addField('SplitDateTime', SplitDateTimeField)
crudl.render(descriptor, options)
```

### Initial values
You can set initial values with every field (based on context, if needed).

```javascript
{
    name: 'date',
    label: 'Date',
    field: 'Date',
    initialValue: () => formatDate(new Date())
},
{
    name: 'entry',
    field: 'hidden',
    initialValue: () => crudl.context.data.id,
},
```

### Validate fields and form
Validation should usually be handled with the API. That said, it sometimes makes sense to use frontend validation as well.

```javascript
{
    name: 'date_gt',
    label: 'Published after',
    field: 'Date',
    /* simple date validation */
    validate: (value, allValues) => {
        const dateReg = /^\d{4}-\d{2}-\d{2}$/
        if (value && !value.match(dateReg)) {
            return 'Please enter a date (YYYY-MM-DD).'
        }
    }
},
{
    name: 'summary',
    label: 'Summary',
    field: 'Textarea',
    validate: (value, allValues) => {
        if (!value && allValues.status == '1') {
            return 'The summary is required with status "Online".'
        }
    }
},
```

In order to validate the complete form, you define a function _validate_ with the _changeView_ or _addView_:

```javascript
var changeView = {
    path: 'entries/:id',
    title: 'Blog Entry',
    actions: { ... },
    validate: function (values) {
        if (!values.category && !values.tags) {
            return { _error: 'Either `Category` or `Tags` is required.' }
        }
    }
}
```

### Custom column with listView
With _Entries_, we added a custom column to the _listView_ based on the currently logged-in user.

```javascript
var listView = {
    path: 'entries',
    title: 'Blog Entries',
    actions: {
        list: function (req) {
            let entries = crudl.connectors.entries.read(req)
            /* here we add a custom column based on the currently logged-in user */
            let entriesWithCustomColumn = transform(entries, (item) => {
                item.is_owner = false
                if (item.owner) item.is_owner = crudl.auth.user == item.owner
                return item
            })
            return entriesWithCustomColumn
        }
    },
}

listView.fields = [
    { ... }
    {
        name: 'is_owner',
        label: 'Owner',
        render: 'boolean',
    },
]
```

### Multiple sort with listView
The _listView_ supports ordering by multiple columns (see entries.js).

### Filtering with listView
Filtering is done by defining fields with _listView.filters_ (see entries.js). You have all the options available with the _changeView_ (e.g. initial values, field dependency, autocompletes, ...).

### Change password
You can only change the password of the currently logged-in _User_ (see collections/users.js)

## Limitations
* Ordering by multiple fields is currently not possible with GraphQL due to in issue with Graphene (see https://github.com/graphql-python/graphene/issues/218).

## Credits & Links
CRUDL and crudl-django-example is written and maintained by vonautomatisch (Patrick Kranzlmüller, Axel Swoboda).

* http://crudl.io
* https://twitter.com/crudlio
* http://vonautomatisch.at
