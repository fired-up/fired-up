export namespace FiredUpPeople {
  type ValidatorFunction = (val) => boolean;

  interface IdPerson {
    flushToken?: boolean;
    id: string;
    person: Person;
  }

  interface SchemaDefinitions {
    [index: number]: [
      string,
      string,
      boolean,
      boolean,
      boolean,
      ValidatorFunction?,
      boolean?
    ];
  }

  interface SchemaRule {
    type?: string;
    userViewable?: boolean;
    userEditable?: boolean;
    indexPastValues?: boolean;
    validator?: ValidatorFunction;
    forceChange?: boolean;
  }
}
