import BluebirdPromise from 'bluebird';
import Hexo from '../../../lib/hexo';
import tagAssetLink from '../../../lib/plugins/tag/asset_link';
import chai from 'chai';
const should = chai.should();

describe('asset_link', () => {
  const hexo = new Hexo(__dirname);
  const assetLinkTag = tagAssetLink(hexo);
  const Post = hexo.model('Post');
  const PostAsset = hexo.model('PostAsset');
  let post;

  hexo.config.permalink = ':title/';

  function assetLink(args) {
    return assetLinkTag.call(post, args.split(' '));
  }

  before(() => hexo.init().then(() => Post.insert({
    source: 'foo.md',
    slug: 'foo'
  })).then(post_ => {
    post = post_;

    return BluebirdPromise.all([
      PostAsset.insert({
        _id: 'bar',
        slug: 'bar',
        post: post._id
      }),
      PostAsset.insert({
        _id: 'bár',
        slug: 'bár',
        post: post._id
      }),
      PostAsset.insert({
        _id: 'spaced asset',
        slug: 'spaced asset',
        post: post._id
      })
    ]);
  }));

  it('default', () => {
    assetLink('bar').should.eql('<a href="/foo/bar" title="bar">bar</a>');
  });

  it('should encode path', () => {
    assetLink('bár').should.eql('<a href="/foo/b%C3%A1r" title="bár">bár</a>');
  });

  it('title', () => {
    assetLink('bar Hello world').should.eql('<a href="/foo/bar" title="Hello world">Hello world</a>');
  });

  it('should escape tag in title by default', () => {
    assetLink('bar "Hello" <world>').should.eql('<a href="/foo/bar" title="&quot;Hello&quot; &lt;world&gt;">&quot;Hello&quot; &lt;world&gt;</a>');
  });

  it('should escape tag in title', () => {
    assetLink('bar "Hello" <world> true').should.eql('<a href="/foo/bar" title="&quot;Hello&quot; &lt;world&gt;">&quot;Hello&quot; &lt;world&gt;</a>');
  });

  it('should not escape tag in title', () => {
    assetLink('bar "Hello" <b>world</b> false').should.eql('<a href="/foo/bar" title="&quot;Hello&quot; &lt;b&gt;world&lt;&#x2F;b&gt;">"Hello" <b>world</b></a>');
  });

  it('with space', () => {
    // {% asset_link "spaced asset" "spaced title" %}
    assetLinkTag.call(post, ['spaced asset', 'spaced title'])
      .should.eql('<a href="/foo/spaced%20asset" title="spaced title">spaced title</a>');
  });

  it('no slug', () => {
    should.not.exist(assetLink(''));
  });

  it('asset not found', () => {
    should.not.exist(assetLink('boo'));
  });
});
