"""INVISIBLE / original 128 BPM score, 160 bars, exactly 300 seconds.

No sampled music. Hybrid cinematic electronica composed from oscillators,
additive plucks, modal chimes, string-like ensembles and synthesized drums.
Ten sections: introduction, pulse, lift, tension, air, momentum, spectral bloom,
descent, restraint, final release. Picture edits land every four bars.
"""
from pathlib import Path
import numpy as np
from scipy.signal import lfilter, butter, sosfilt
import wave
SR=48000; DUR=300; BEAT=60/128; BAR=4*BEAT
rng=np.random.default_rng(8128)
mix=np.zeros((SR*DUR,2),np.float32)
def add(s,at,vol=1,pan=0,echo=False):
    n0=round(at*SR)
    if n0<0 or n0>=len(mix):return
    n=min(len(s),len(mix)-n0)
    mix[n0:n0+n,0]+=s[:n]*vol*np.sqrt((1-pan)/2)
    mix[n0:n0+n,1]+=s[:n]*vol*np.sqrt((1+pan)/2)
    if echo:
        for delay,g,p in [(BEAT*.75,.26,-pan),(BEAT*1.5,.13,pan),(BEAT*2.25,.055,-pan)]:add(s,at+delay,vol*g,p)
def hz(m):return 440*2**((m-69)/12)
cache={}
def tone(m,dur,kind='pluck'):
    key=(m,round(dur,3),kind)
    if key in cache:return cache[key]
    t=np.arange(round(dur*SR))/SR;f=hz(m)
    if kind=='pad':
        # Soft bowed harmonics, slow attack and stereo detuning in the arrangement.
        s=sum(np.sin(2*np.pi*f*det*h*t+p)/h**1.6 for h in range(1,6) for det,p in [(.998,0),(1.002,.7)])/2
        env=np.minimum(t/.55,1)*np.minimum((dur-t)/1.4,1)
        s*=env*(.88+.12*np.sin(2*np.pi*.3*t))
    elif kind=='bass':
        s=(np.sin(2*np.pi*f*t)+.3*np.sin(4*np.pi*f*t)+.08*np.sin(6*np.pi*f*t))*(1-np.exp(-90*t))*np.exp(-2.7*t)
    elif kind=='lead':
        s=sum(np.sin(2*np.pi*f*h*t+.004*np.sin(2*np.pi*5*t))/h**1.8 for h in range(1,5))
        s*=np.minimum(t/.025,1)*np.minimum((dur-t)/.16,1)*np.exp(-t*.55)
    elif kind=='bell':
        s=(np.sin(2*np.pi*f*t)+.35*np.sin(2*np.pi*f*2.002*t)*np.exp(-t*2)+.1*np.sin(2*np.pi*f*3.98*t)*np.exp(-t*4))*(1-np.exp(-120*t))*np.exp(-t*1.2)
    else:
        s=sum(np.sin(2*np.pi*f*h*t)/h**1.4*np.exp(-t*h*2.2) for h in range(1,7))*(1-np.exp(-t*200))*np.exp(-t*1.5)
    s=s.astype(np.float32);cache[key]=s;return s
def drum(kind):
    dur={'kick':.6,'snare':.28,'hat':.09,'open':.3,'impact':2.8}[kind];t=np.arange(round(dur*SR))/SR
    n=rng.normal(0,1,len(t))
    if kind=='kick':s=np.sin(2*np.pi*(42*t+80*.018*(1-np.exp(-t/.018))))*np.exp(-t*10)+n*.025*np.exp(-t*160)
    elif kind=='snare':s=(np.diff(n,prepend=0)*.18+np.sin(2*np.pi*185*t)*.2)*np.exp(-t*18)
    elif kind in ['hat','open']:s=np.diff(n,prepend=0)*np.exp(-t*(70 if kind=='hat' else 13))*.2
    else:s=sosfilt(butter(2,1600,fs=SR,output='sos'),n)*np.exp(-t*2)*.3+np.sin(2*np.pi*42*t)*np.exp(-t*4)*.5
    return s.astype(np.float32)
drums={k:drum(k) for k in ['kick','snare','hat','open','impact']}
# Dm(add9), Bbmaj7, Fmaj7, C(add9), Gm9, Asus4 / A. Different sections reharmonize.
chords=[[50,57,62,65,69,76],[46,53,58,62,65,69],[53,60,64,65,69,72],[48,55,60,64,67,74],[43,50,57,58,62,65],[45,52,57,62,64,69],[45,52,57,61,64,69]]
progressions=[[0,0,1,5],[0,1,2,3],[4,1,0,5],[0,3,4,6],[0,2,1,5],[4,1,2,3],[0,1,4,6],[0,4,1,5],[4,0,1,6],[0,1,2,3]]
boundaries=[0,30,60,82.5,105,135,165,195,225,255,300]
energy=[.12,.7,.65,.8,.18,.62,.95,.7,.38,1.0]
def section(at):return max(i for i,s in enumerate(boundaries[:-1]) if at>=s)
for bar in range(160):
    at=bar*BAR;sec=section(at);e=energy[sec];ch=chords[progressions[sec][(bar//4)%4]]
    # Rich suspended harmonies. Four-bar pads overlap slightly.
    if bar%4==0:
        for j,m in enumerate(ch[1:]):add(tone(m,4*BAR+1.5,'pad'),at,.047,(j-2)*.36)
        add(tone(ch[0]-12,4*BAR+1.2,'pad'),at,.075,0)
        add(drums['impact'],at,.15+.18*e)
    if at>=15 and at<292.5:
        motif=[0,2,3,4,2,1,4,3,0,3,5,4,2,4,3,1]
        for k in range(16):
            if (sec in [0,4,8] and k%2) or (bar%4==3 and k>=14):continue
            note=ch[motif[k]]+12
            add(tone(note,1.1),at+k*BEAT/4,.04+.04*e,np.sin(k*.9+bar)*.65,True)
    if sec not in [0,4] and at<292.5:
        for b in range(4):
            pos=at+b*BEAT
            add(drums['kick'],pos,.38+.12*e)
            add(tone(ch[0]-12,.7,'bass'),pos+BEAT*.48,.16+.065*e)
            if b%2:add(drums['snare'],pos,.4,0)
            for k in range(2 if e<.8 else 4):
                add(drums['hat'],pos+k*BEAT/(2 if e<.8 else 4),.12 if k%2 else .17,(-1 if k%2 else 1)*.45)
            if b%2==0:add(drums['open'],pos+BEAT*.5,.16,-.15)
    elif at>=15 and at<292.5:
        add(drums['kick'],at,.18)
    # A distinct, evolving lead melody instead of an endless arpeggio alone.
    if sec in [2,3,6,7,9] and bar%2==0 and at<292.5:
        melody=[(0,4,1.5), (1.5,3,.5), (2.5,2,1), (4,5,1.5), (6,4,1)]
        for off,degree,length in melody:add(tone(ch[degree]+12,length*BEAT,'lead'),at+off*BEAT,.075 if sec<9 else .1,0,True)
    if bar%4==2:add(tone(ch[4]+12,2.7,'bell'),at,.06,.4,True)
    # Short drum fill on the last bar of a phrase.
    if bar%4==3 and e>.5:
        for k in range(4):add(drums['snare'],at+3*BEAT+k*BEAT/4,.09+.025*k,(k-1.5)*.15)
    if bar%16==0:print(f'Composed {at:.1f}s / 300s',flush=True)
# Designed risers and downbeat sub-drops at the major picture cuts.
for at in boundaries[1:-1]:
    dur=2*BAR;t=np.arange(round(dur*SR))/SR
    n=rng.normal(0,1,len(t));n=sosfilt(butter(2,4500,fs=SR,output='sos'),n)
    riser=(n*.09+np.sin(2*np.pi*(170*t+160*t*t))* .025)*(t/dur)**2
    add(riser,at-dur,.7,-.2);add(drums['impact'],at,.45)
    s=np.sin(2*np.pi*(32*t+30*.18*(1-np.exp(-t/.18))))*np.exp(-t*2)
    add(s,at,.24)
# Concluding D-minor/add9 resolve and a long tail, leaving the final title space.
for i,m in enumerate([50,57,62,65,69,76]):add(tone(m,8,'pad'),292.5,.09,(i-2.5)*.25)
# Lightweight stereo reverb, then soft limiting. No borrowed samples.
print('Mastering stereo score...',flush=True)
dry=mix.copy()
for delay,gain in [(0.071,.12),(.113,.1),(.173,.08),(.257,.06),(.419,.04)]:
    k=round(delay*SR);mix[k:,0]+=dry[:-k,1]*gain;mix[k:,1]+=dry[:-k,0]*gain
del dry
mix=np.tanh(mix*1.2);peak=float(np.max(np.abs(mix)));mix*=.88/max(peak,1e-9)
f=SR*3;mix[:f]*=np.linspace(0,1,f)[:,None];mix[-f:]*=np.linspace(1,0,f)[:,None]
Path('output').mkdir(exist_ok=True)
with wave.open('output/score.wav','wb') as f:
    f.setnchannels(2);f.setsampwidth(2);f.setframerate(SR);f.writeframes((mix*32767).astype('<i2').tobytes())
print('300.000 seconds / 48 kHz stereo / 128 BPM / 640 beats',flush=True)
