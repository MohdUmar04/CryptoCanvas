import CodeMirror from '@uiw/react-codemirror'
import { json } from '@codemirror/lang-json'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'

type Props = {
  value: string
  onChange: (v: string) => void
  className?: string
  height?: string
  placeholder?: string
  readOnly?: boolean
}

export function JsonEditor({
  value,
  onChange,
  className,
  height = '180px',
  placeholder,
  readOnly,
}: Props) {
  const { theme } = useTheme()
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={[json()]}
      theme={theme === 'dark' ? 'dark' : 'light'}
      height={height}
      placeholder={placeholder}
      readOnly={readOnly}
      basicSetup={{
        lineNumbers: false,
        foldGutter: false,
        highlightActiveLine: false,
        autocompletion: false,
      }}
      className={cn(
        'overflow-hidden rounded-md border bg-background font-mono text-[13px]',
        className,
      )}
    />
  )
}
