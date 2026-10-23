# Workaround for jekyll-paginate-v2 + Jekyll 4 Liquid template cache collision.
#
# Jekyll 4 caches parsed Liquid templates by `page.path`
# (Jekyll::LiquidRenderer::File#parse). jekyll-paginate-v2's PaginationPage never
# sets @dir, so every generated pagination page reports the same path
# ("index.html"). When a site has more than one paginated template (here
# /blog/ and /blog/en/), all templates after the first reuse the first one's
# parsed Liquid AST. That made the Chinese blog listing render the English
# template (wrong tag/category links, wrong language).
#
# Give every pagination page a path that is unique per URL so the cache keys
# do not collide. This hook runs after the gem plugins are loaded and before
# the pagination generator runs.
Jekyll::Hooks.register :site, :post_read do |_site|
  next unless defined?(Jekyll::PaginateV2::Generator::PaginationPage)

  Jekyll::PaginateV2::Generator::PaginationPage.class_eval do
    def path
      unique = @url.to_s.empty? ? object_id : @url
      "#{super}##{unique}"
    end
  end
end
