const path = require('node:path');

const generatedSegment = `${path.sep}generated${path.sep}prisma`;

/**
 * Custom resolver that lets ts-jest load Prisma's TS artifacts which import
 * sibling files using `.js` extensions. When the importing file lives inside
 * the generated/prisma directory we remap those `.js` specifiers to their
 * corresponding `.ts` files so Jest can compile them on the fly.
 */
const resolver = (request, options) => {
  const defaultResolver = options.defaultResolver;
  const basedir = options.basedir ?? '';

  if (
    basedir.includes(generatedSegment) &&
    request.startsWith('.') &&
    request.endsWith('.js')
  ) {
    const tsRequest = request.replace(/\.js$/, '.ts');
    try {
      return defaultResolver(tsRequest, options);
    } catch (error) {
      // fall back to the original request below
    }
  }

  return defaultResolver(request, options);
};

module.exports = resolver;
