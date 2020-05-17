export interface UnsubscribeOptions {
  exclude: string[];
}

export function Unsubscribable(options: UnsubscribeOptions = {exclude: []}): ClassDecorator {

  return (constructor) => {
    const original = constructor.prototype.ngOnDestroy;

    constructor.prototype.ngOnDestroy = function() {
      for (const prop in this) {
        if (this.hasOwnProperty(prop)) {
          const property = this[prop];
          if (!options.exclude.includes(prop)) {
            if (property && (typeof property.unsubscribe === 'function')) {
              property.unsubscribe();
            }
          }
        }
      }
      if (original && typeof original === 'function') {
        original.apply(this, arguments);
      }
    };
  };

}
