import { Separator } from "@/components/ui/separator"
import { config } from "@/lib/config"

export function Footer() {
  return (
    <footer className="border-t py-12">
      <div className="container max-w-6xl">
        {/* 4컬럼 그리드: 브랜드 + 링크 섹션 3개 */}
        <div className="grid gap-8 md:grid-cols-4">
          {/* 브랜드 영역 */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg">{config.name}</h3>
            <p className="text-sm text-muted-foreground">
              {config.footer.description}
            </p>
            <div className="flex gap-4">
              {config.footer.social.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.name}
                </a>
              ))}
            </div>
          </div>

          {/* 링크 섹션들 */}
          {config.footer.sections.map((section) => (
            <div key={section.title} className="space-y-4">
              <h4 className="font-semibold text-sm">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.title}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        {/* 저작권 */}
        <p className="text-sm text-muted-foreground text-center">
          &copy; {new Date().getFullYear()} {config.name}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
