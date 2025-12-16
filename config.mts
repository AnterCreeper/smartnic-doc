import { defineConfig } from 'vitepress'

export default defineConfig({
  base: "/smartnic-doc/",
  lang: 'zh-CN',
  title: 'SmartNIC Getting Started',
  description: 'An Overview of SmartNIC Technology',
  lastUpdated: true,
  cleanUrls: true,
  srcExclude: ['README.md'],
  rewrites: {},
  markdown: {
    math: true
  },
  head: [
    ["link", { rel: "icon", href: `/smartnic-doc/favicon.ico` }],  
  ],
  themeConfig: {
    i18nRouting: false,
    sidebar: {
      '/': [
        {
          text: 'SmartNIC',
          items: [
            {
              text: '01. 简介',
              link: 'docs/01-intro'
            }
          ]
        }
      ]
    },
    outline: {
      label: '目录',
      level: [2, 4]
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/antercreeper/smartnic-doc' }],
    footer: {
      message: 'Powered by AnterCreeper',
      copyright: '© 2025 Zhihao Wang<wangzhihao9@hotmail.com>, licensed under CC BY-NC-SA 4.0'
    },
    docFooter: {
      prev: '上一节',
      next: '下一节'
    },
    lastUpdated: {
      text: '更新于',
      formatOptions: {
        dateStyle: 'full',
        timeStyle: 'medium',
        forceLocale: true
      }
    },
    editLink: {
      pattern: 'https://github.com/antercreeper/smartnic-doc/edit/main/:path',
      text: '在GitHub上更新本页'
    },
    darkModeSwitchLabel: '颜色选择',
    lightModeSwitchTitle: '切换至亮色模式',
    darkModeSwitchTitle: '切换至暗色模式',
    sidebarMenuLabel: '目录',
    returnToTopLabel: '回到顶部',
    externalLinkIcon: true,
    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: '搜索',
                buttonAriaLabel: '搜索'
              },
              modal: {
                displayDetails: '显示详细列表',
                resetButtonTitle: '重置搜索',
                backButtonTitle: '关闭搜索',
                noResultsText: '没有结果',
                footer: {
                  selectText: '选择',
                  selectKeyAriaLabel: '输入',
                  navigateText: '导航',
                  navigateUpKeyAriaLabel: '上箭头',
                  navigateDownKeyAriaLabel: '下箭头',
                  closeText: '关闭',
                  closeKeyAriaLabel: 'esc'
                }
              }
            }
          }
        }
      }
    }
  }
})
