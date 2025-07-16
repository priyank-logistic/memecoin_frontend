// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// Third-party Imports
import classnames from 'classnames'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

const defaultSuggestions = [
  {
    sectionLabel: 'Popular Searches',
    items: [
      {
        label: 'Live Token Overview',
        href: '/apps/live-token-overview',
        icon: 'tabler-eye'
      },
      {
        label: 'My Trade Info',
        href: '/apps/My-Trade-info',
        icon: 'tabler-briefcase'
      },
      {
        label: 'System Monitor',
        href: '/apps/System-Monitor',
        icon: 'tabler-device-desktop'
      },
    ]
  },
  {
    sectionLabel: 'Apps',
    items: [
      {
        label: 'Bot Control Panel',
        href: '/apps/Bot-control-panel',
        icon: 'tabler-settings'
      },
      {
        label: 'Manual Controls',
        href: '/apps/manual-control',
        icon: 'tabler-manual-gearbox'
      },
    ]
  },
  
  // {
  //   sectionLabel: 'Pages',
  //   items: [
  //     {
  //       label: 'Account Settings',
  //       href: '/pages/account-settings',
  //       icon: 'tabler-settings'
  //     },
  //   ]
  // },
]

const DefaultSuggestions = ({ setOpen }) => {
  // Hooks
  const { lang: locale } = useParams()

  return (
    <div className='flex grow flex-wrap gap-x-[48px] gap-y-8 plb-14 pli-16 overflow-y-auto overflow-x-hidden bs-full'>
      {defaultSuggestions.map((section, index) => (
        <div
          key={index}
          className='flex flex-col justify-center overflow-x-hidden gap-4 basis-full sm:basis-[calc((100%-3rem)/2)]'
        >
          <p className='text-xs leading-[1.16667] uppercase text-textDisabled tracking-[0.8px]'>
            {section.sectionLabel}
          </p>
          <ul className='flex flex-col gap-4'>
            {section.items.map((item, i) => (
              <li key={i} className='flex'>
                <Link
                  href={getLocalizedUrl(item.href, locale)}
                  className='flex items-center overflow-x-hidden cursor-pointer gap-2 hover:text-primary focus-visible:text-primary focus-visible:outline-0'
                  onClick={() => setOpen(false)}
                >
                  {item.icon && <i className={classnames(item.icon, 'flex text-xl')} />}
                  <p className='text-[15px] leading-[1.4667] truncate'>{item.label}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export default DefaultSuggestions
