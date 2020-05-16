export interface UnsubscribeOptions {
  exclude: string[];
}

export function Unsubscribable(options: UnsubscribeOptions = {exclude: []}): ClassDecorator {

  return (constructor) => {
    const original = constructor.prototype.ngOnDestroy;

    constructor.prototype.ngOnDestroy = function() {
      for (const prop in this) {
        console.log(this);
        console.log(prop);
        const property = this[prop];
        if (!options.exclude.includes(prop)) {
          if (property && (typeof property.unsubscribe === 'function')) {
            console.log('unsubscribing');
            property.unsubscribe();
          }
        }
      }
      if (original && typeof original === 'function') {
        original.apply(this, arguments);
      }
    };
  };

}
