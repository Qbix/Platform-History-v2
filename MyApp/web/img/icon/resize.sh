#! /bin/bash

for i in 40 70 76 80 120 144 150 152 180 196 200 310; do convert -resize "$i"x"$i" icon.png $i.png; done

convert -resize 200x icon.png 200x.png

for i in 36 48 72 96 144 192; do convert -resize "$i"x"$i" icon.png android-icon-"$i"x"$i".png; done