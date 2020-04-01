import React from 'react';
import Link from 'next/link';

const NextLink = React.forwardRef<any, any>(
  ({ href, as, prefetch, ...props }, ref) => (
    <Link href={href} as={as} prefetch={prefetch} passHref>
      <a ref={ref} {...props} />
    </Link>
  )
);

NextLink.displayName = 'NextLink';

export default NextLink;
