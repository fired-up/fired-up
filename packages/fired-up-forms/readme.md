# Fired Up Forms

Forms are the heart of Fired Up, our goal is to provide a powerful forms library that allows users to quickly deploy new forms or changes to respond to the speed of political events.

## Callbacks

Callbacks for common form events are implemented as standard Javascript events emitted on the window. This makes it easier to support multiple forms on each page without having to re-implement actions for each one.

### firedup-forms-changed

Emitted when a field is changed. Useful for updating another component on page in realtime when the form is updated.

```
window.addEventListener('firedup-forms-changed', event => {
  console.log( event.formID, event.fields )
});

```

### firedup-forms-errored

Emitted when the form has an error submitting. Intended for analytics.

```
window.addEventListener('firedup-forms-errored', event => {
  console.log( event.formID, event.error )
});
```

### firedup-forms-submitted

Emitted when the form successfully submits. Be sure to use an async function and do your analytics work before redirecting the page if you choose to implement a redirect.

```
window.addEventListener('firedup-forms-submitted', event => {
  console.log( event.formID, event.fields )
});
```

## Building a schema

A form schema is derived from JSON. The gist is that each form is represented in an array and each row or group of fields within that is a nested array. A lightweight example:

```javascript
[
  [
    {
      name: 'given_name',
      label: 'First name',
      placholder: 'Your first name',
      cols: 6,
    },
    {
      name: 'family_name',
      label: ':Last name',
      placholder: 'Your last name',
      cols: 6,
    },
  ],
  [
    {
      name: 'postal_code',
      label: 'ZIP Code',
    },
  ],
];
```

renders a form that looks roughly like:

```
First name          Last name
[Your first name]   [Your last name ]

ZIP Code
[                                   ]
```
