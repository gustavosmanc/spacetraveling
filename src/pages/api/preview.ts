import { Document } from '@prismicio/client/types/documents';
import { NextApiRequest, NextApiResponse } from 'next';
import { getPrismicClient } from '../../services/prismic';

const linkResolver = (doc: Document): string => {
  if (doc.type === 'post') {
    return `/post/${doc.uid}`;
  }

  return '/';
};

const preview = async (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> => {
  const { token: ref, documentId } = req.query;

  const redirectUrl = await getPrismicClient(req)
    .getPreviewResolver(ref.toString(), documentId.toString())
    .resolve(linkResolver, '/');

  if (!redirectUrl) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  res.setPreviewData({ ref });

  res.writeHead(302, { Location: `${redirectUrl}` });

  return res.end();
};

export default preview;
