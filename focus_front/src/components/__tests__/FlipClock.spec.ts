import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import FlipClock from '@/components/FlipClock.vue'

const NOW = 1_700_000_000_000

function reducedMotion(matches: boolean) {
  window.matchMedia = (() => ({ matches })) as unknown as typeof window.matchMedia
}

function flippingCount(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll('.flip-leaf').length / 2
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
  reducedMotion(false)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('FlipClock', () => {
  it('folds only the digits that changed', async () => {
    const wrapper = mount(FlipClock, { props: { value: '25:00' } })

    vi.setSystemTime(NOW + 1000)
    await wrapper.setProps({ value: '24:59' })

    expect(flippingCount(wrapper)).toBe(3)
  })

  it('folds nothing when only one digit moves', async () => {
    const wrapper = mount(FlipClock, { props: { value: '00:01' } })

    vi.setSystemTime(NOW + 1000)
    await wrapper.setProps({ value: '00:02' })

    expect(flippingCount(wrapper)).toBe(1)
  })

  it('stops folding once the animation is over', async () => {
    const wrapper = mount(FlipClock, { props: { value: '00:01' } })

    vi.setSystemTime(NOW + 1000)
    await wrapper.setProps({ value: '00:02' })
    expect(flippingCount(wrapper)).toBe(1)

    await vi.advanceTimersByTimeAsync(400)
    expect(flippingCount(wrapper)).toBe(0)
    expect(wrapper.text()).toContain('00:02')
  })

  it('paints a value that jumped instead of folding 300 times', async () => {
    const wrapper = mount(FlipClock, { props: { value: '25:00' } })

    vi.setSystemTime(NOW + 5 * 60_000)
    await wrapper.setProps({ value: '20:00' })

    expect(flippingCount(wrapper)).toBe(0)
    expect(wrapper.text()).toContain('20:00')
  })

  it('paints without folding when the hours appear', async () => {
    const wrapper = mount(FlipClock, { props: { value: '59:59' } })

    vi.setSystemTime(NOW + 1000)
    await wrapper.setProps({ value: '01:00:00' })

    expect(flippingCount(wrapper)).toBe(0)
    expect(wrapper.text()).toContain('01:00:00')
  })

  it('does not fold at all with reduced motion', async () => {
    reducedMotion(true)
    const wrapper = mount(FlipClock, { props: { value: '00:01' } })

    vi.setSystemTime(NOW + 1000)
    await wrapper.setProps({ value: '00:02' })

    expect(flippingCount(wrapper)).toBe(0)
    expect(wrapper.text()).toContain('00:02')
  })
})
